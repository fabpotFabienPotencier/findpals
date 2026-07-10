import { useEffect, useMemo, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Phone, Video, Info, Paperclip, Smile, Loader2, Search, User, ArrowLeft } from 'lucide-react';
import { secureStorage } from '../utils/secureStorage';
import { users } from '../services/api';

type ChatPreview = {
    id: string;
    name: string;
    lastMessage?: string;
    isDM?: boolean;
};

type ChatMessage = {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    createdAt: string;
    sender?: {
        displayName?: string;
        username?: string;
        avatarUrl?: string;
    };
};

const getSocketUrl = (apiUrl: string) => {
    try {
        const url = new URL(apiUrl);
        if (url.pathname.endsWith('/api')) {
            url.pathname = url.pathname.slice(0, -4);
        }
        return url.origin;
    } catch {
        return apiUrl;
    }
};

const SOCKET_URL = getSocketUrl(import.meta.env.VITE_API_URL || 'http://localhost:8023');

export const MessagingPage = ({
    activeChat,
    setActiveChat,
    userProfile,
    setCurrentPage
}: {
    activeChat?: { id: string; name: string } | null;
    setActiveChat?: (chat: { id: string; name: string } | null) => void;
    userProfile?: any;
    setCurrentPage?: (page: string) => void;
}) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string>(activeChat?.id || 'global-lobby');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [selfId, setSelfId] = useState<string | null>(null);
    const [mobileActiveTab, setMobileActiveTab] = useState<'list' | 'chat'>('list');
    const [loading, setLoading] = useState(true);

    // Sidebar search users to start a new chat
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // Local tracking of created DM conversations during session
    const [localDMs, setLocalDMs] = useState<ChatPreview[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Combine activeChat, localDMs and default Global Lobby into the list
    const chatsList = useMemo(() => {
        const list: ChatPreview[] = [
            { id: 'global-lobby', name: 'Global Lobby', lastMessage: 'Public encrypted chat' }
        ];

        // Add active chat if it exists and isn't already there
        if (activeChat && activeChat.id !== 'global-lobby') {
            list.push({
                id: activeChat.id,
                name: activeChat.name,
                lastMessage: 'Direct secure connection',
                isDM: true
            });
        }

        // Add other local DMs
        localDMs.forEach(dm => {
            if (!list.some(item => item.id === dm.id)) {
                list.push(dm);
            }
        });

        return list;
    }, [activeChat, localDMs]);

    // Handle searching users in the sidebar
    useEffect(() => {
        const searchSidebarUsers = async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                setSearching(false);
                return;
            }
            setSearching(true);
            try {
                const res = await users.search(searchQuery.trim(), 5);
                // Filter out self
                setSearchResults(res.data.filter((u: any) => u.id !== userProfile?.id));
            } catch (err) {
                console.error(err);
            } finally {
                setSearching(false);
            }
        };

        const timer = setTimeout(searchSidebarUsers, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, userProfile?.id]);

    const handleStartDM = (partner: any) => {
        const partnerName = partner.displayName || partner.username;
        const dmChatId = `dm-${[userProfile?.id, partner.id].sort().join('-')}`;

        const newDM = {
            id: dmChatId,
            name: partnerName,
            lastMessage: 'Click to start chatting securely',
            isDM: true
        };

        setLocalDMs(prev => [newDM, ...prev]);
        if (setActiveChat) {
            setActiveChat({ id: dmChatId, name: partnerName });
        }
        setCurrentChatId(dmChatId);
        setMobileActiveTab('chat');
        setSearchQuery('');
        setSearchResults([]);
    };

    useEffect(() => {
        // Auto scroll to bottom of messages
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const token = await secureStorage.getItem('auth_token');
            if (token) {
                const [, payloadBase64] = token.split('.');
                const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
                const payload = JSON.parse(payloadJson);
                setSelfId(payload.sub);
            }

            const s = io(`${SOCKET_URL}/messaging`, {
                transports: ['websocket'],
                auth: { token },
            });
            setSocket(s);

            s.on('connect', () => {
                s.emit('joinChat', currentChatId);
                s.emit('getChatHistory', currentChatId);
                setLoading(false);
            });

            s.on('chatHistory', (data: { chatId: string, messages: any[] }) => {
                if (data.chatId === currentChatId) {
                    setMessages(data.messages);
                }
            });

            s.on('newMessage', (msg: any) => {
                if (msg.chatId === currentChatId) {
                    setMessages(prev => [...prev, {
                        id: msg.id,
                        chatId: msg.chatId,
                        senderId: msg.senderId,
                        content: msg.content,
                        createdAt: msg.createdAt,
                        sender: msg.sender
                    }]);
                }
            });

            s.on('userTyping', (payload: { chatId: string, username: string }) => {
                if (payload.chatId === currentChatId) {
                    setTypingUser(payload.username);
                    setTimeout(() => setTypingUser(null), 1500);
                }
            });

            return () => {
                s.disconnect();
            };
        };

        init();
    }, [currentChatId]);

    const handleSend = () => {
        if (!socket || !input.trim() || !selfId) return;
        const payload = {
            chatId: currentChatId,
            content: input.trim(),
            senderId: selfId,
            sender: {
                username: userProfile?.username,
                displayName: userProfile?.displayName,
                avatarUrl: userProfile?.avatarUrl
            }
        };
        socket.emit('sendMessage', payload);
        setInput('');
    };

    const handleTyping = () => {
        if (!socket || !userProfile) return;
        socket.emit('typing', { chatId: currentChatId, username: userProfile.displayName || userProfile.username });
    };

    const activeChatDetail = chatsList.find(c => c.id === currentChatId);

    return (
        <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-100px)] theme-card rounded-3xl overflow-hidden mt-0 md:mt-4">
            {/* Chats List Sidebar */}
            <div className={`w-full md:w-80 border-r theme-border flex flex-col theme-bg-secondary ${mobileActiveTab === 'chat' ? 'hidden md:flex' : 'flex'}`}>
                {/* Search / DM creation area */}
                <div className="p-4 border-b theme-border relative">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Start a secure DM..."
                            className="w-full theme-input rounded-xl text-sm pl-9 pr-4 py-2 placeholder:text-slate-600"
                        />
                    </div>

                    {/* Search results dropdown popup */}
                    {searchQuery.trim().length >= 2 && (
                        <div className="absolute left-4 right-4 mt-2 theme-card rounded-2xl p-2 shadow-2xl z-30 max-h-60 overflow-y-auto">
                            {searching && (
                                <div className="flex justify-center p-3">
                                    <Loader2 className="animate-spin theme-text-accent" size={16} />
                                </div>
                            )}
                            {!searching && searchResults.length === 0 && (
                                <div className="text-center py-4 theme-text-muted font-mono text-[10px] uppercase">
                                    No users found
                                </div>
                            )}
                            {!searching && searchResults.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => handleStartDM(user)}
                                    className="flex items-center gap-3 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden theme-bg-surface border theme-border">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold bg-blue-600">
                                                {user.username[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="font-bold text-xs truncate">
                                            {user.displayName || user.username}
                                        </div>
                                        <div className="text-[10px] theme-text-muted font-mono">@{user.username}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {chatsList.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => {
                                setCurrentChatId(chat.id);
                                setMobileActiveTab('chat');
                                if (setActiveChat) {
                                    if (chat.isDM) {
                                        setActiveChat({ id: chat.id, name: chat.name });
                                    } else {
                                        setActiveChat(null);
                                    }
                                }
                            }}
                            className={`p-4 flex gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all ${chat.id === currentChatId ? 'bg-blue-500/5 dark:bg-blue-500/10 border-l-2 border-blue-500' : ''}`}
                        >
                            <div className="w-12 h-12 rounded-full theme-bg-surface border theme-border flex items-center justify-center font-bold theme-text-primary flex-shrink-0">
                                {chat.isDM ? (
                                    chat.name[0]?.toUpperCase()
                                ) : (
                                    <User size={20} className="theme-text-accent" />
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm truncate">{chat.name}</span>
                                </div>
                                <p className="text-xs theme-text-muted truncate">{chat.lastMessage}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Conversation Area */}
            <div className={`flex-1 flex flex-col bg-slate-950/5 dark:bg-slate-950/30 ${mobileActiveTab === 'list' ? 'hidden md:flex' : 'flex'}`}>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b theme-border flex justify-between items-center theme-bg-secondary">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileActiveTab('list')}
                            className="md:hidden p-1.5 rounded-full hover:theme-bg-secondary theme-text-muted hover:theme-text-primary transition-colors mr-1"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="w-10 h-10 rounded-full theme-bg-surface border theme-border flex items-center justify-center font-bold">
                            {activeChatDetail?.isDM ? activeChatDetail.name[0]?.toUpperCase() : <User size={18} className="theme-text-accent" />}
                        </div>
                        <div>
                            <div className="font-bold text-sm">{activeChatDetail?.name || 'Secure Lobby'}</div>
                            <div className="text-[10px] text-green-500 flex items-center gap-1 font-mono uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Secure Channel Active
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 theme-text-muted">
                        <button onClick={() => setCurrentPage?.('live')} className="hover:theme-text-primary transition-colors"><Phone size={20} /></button>
                        <button onClick={() => setCurrentPage?.('live')} className="hover:theme-text-primary transition-colors"><Video size={20} /></button>
                        <button className="hover:theme-text-primary transition-colors"><Info size={20} /></button>
                    </div>
                </div>

                {/* Message List */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-full theme-text-muted text-xs gap-2 font-mono uppercase tracking-[0.2em]">
                            <Loader2 className="animate-spin" size={18} /> Establishing secure link...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full theme-text-muted text-xs font-mono uppercase tracking-widest gap-2">
                            <span>No messages in this chat.</span>
                            <span className="text-[10px] opacity-60">Messages are end-to-end encrypted.</span>
                        </div>
                    ) : (
                        messages.map(msg => {
                            const isMine = msg.senderId === selfId;
                            const senderName = msg.sender?.displayName || msg.sender?.username || 'Anonymous';
                            return (
                                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end ml-auto' : 'items-start'} max-w-[70%]`}>
                                    {!isMine && (
                                        <span className="text-[10px] font-mono theme-text-muted mb-1 ml-1">
                                            {senderName}
                                        </span>
                                    )}
                                    <div className={`${isMine ? 'theme-button-accent font-medium rounded-2xl rounded-tr-none shadow-sm' : 'theme-bg-surface theme-text-primary border theme-border rounded-2xl rounded-tl-none'} p-4 text-sm`}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[9px] theme-text-muted mt-1 font-mono uppercase tracking-[0.2em]">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                    {typingUser && (
                        <div className="text-[10px] theme-text-muted font-mono uppercase tracking-[0.2em] animate-pulse">
                            {typingUser} is typing...
                        </div>
                    )}
                </div>

                {/* Chat Input Input bar */}
                <div className="p-4 border-t theme-border theme-bg-secondary">
                    <div className="theme-bg-surface border theme-border rounded-2xl flex items-center px-4 py-2 transition-all">
                        <button className="text-slate-500 hover:text-slate-350 p-2"><Paperclip size={20} /></button>
                        <input
                            type="text"
                            placeholder="Type an encrypted message..."
                            className="flex-1 bg-transparent border-none text-sm px-4 focus:outline-none focus:ring-0"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSend();
                                } else {
                                    handleTyping();
                                }
                            }}
                        />
                        <button className="text-slate-500 hover:text-slate-355 p-2"><Smile size={20} /></button>
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="theme-button-accent p-2.5 rounded-xl transition-all ml-2 shadow-sm disabled:opacity-60"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
