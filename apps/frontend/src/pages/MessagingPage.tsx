import React, { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Phone, Video, Info, Paperclip, Smile, Loader2 } from 'lucide-react';
import { secureStorage } from '../utils/secureStorage';

type ChatPreview = {
    id: string;
    name: string;
    lastMessage?: string;
};

type ChatMessage = {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    createdAt: string;
    isMine?: boolean;
};

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8023';

export const MessagingPage = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string>('global-lobby');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [selfId, setSelfId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const chats: ChatPreview[] = useMemo(() => ([
        { id: 'global-lobby', name: 'Global Lobby', lastMessage: 'Welcome to findpals secure chat.' },
    ]), []);

    useEffect(() => {
        const init = async () => {
            const token = await secureStorage.getItem('auth_token');
            if (token) {
                const [, payloadBase64] = token.split('.');
                const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
                const payload = JSON.parse(payloadJson);
                setSelfId(payload.sub);
            }

            const s = io(`${SOCKET_URL}/messaging`, {
                transports: ['websocket'],
            });
            setSocket(s);

            s.on('connect', () => {
                s.emit('joinChat', currentChatId);
                setLoading(false);
            });

            s.on('newMessage', (msg: any) => {
                setMessages(prev => [...prev, {
                    id: msg.id,
                    chatId: msg.chatId,
                    senderId: msg.senderId,
                    content: msg.content,
                    createdAt: msg.createdAt,
                    isMine: msg.senderId === selfId,
                }]);
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

        social init();
    }, [currentChatId]);

    const handleSend = () => {
        if (!socket || !input.trim() || !selfId) return;
        const payload = {
            chatId: currentChatId,
            content: input.trim(),
            senderId: selfId,
        };
        socket.emit('sendMessage', payload);
        setInput('');
    };

    const handleTyping = () => {
        if (!socket || !selfId) return;
        socket.emit('typing', { chatId: currentChatId, username: selfId.slice(0, 6) });
    };

    return (
        <div className="flex h-[calc(100vh-100px)] border border-white/5 rounded-3xl overflow-hidden bg-white/5 mt-4">
            {/* Chats List */}
            <div className="w-80 border-r border-white/5 flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <input
                        type="text"
                        placeholder="Search messages..."
                        className="w-full bg-slate-900 border-none rounded-xl text-sm px-4 py-2 focus:ring-1 ring-cyan-500/50"
                    />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setCurrentChatId(chat.id)}
                            className={`p-4 flex gap-3 cursor-pointer hover:bg-white/5 transition-all ${chat.id === currentChatId ? 'bg-cyan-500/5 border-l-2 border-cyan-400' : ''}`}
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm">{chat.name}</span>
                                </div>
                                <p className="text-xs text-slate-400 truncate">{chat.lastMessage}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-950/30">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#0d0e26]/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                        <div>
                            <div className="font-bold text-sm">{currentChatId === 'global-lobby' ? 'Global Lobby' : currentChatId}</div>
                            <div className="text-[10px] text-green-500 flex items-center gap-1 font-mono uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Secure Channel Active
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                        <button className="hover:text-cyan-400 transition-colors"><Phone size={20} /></button>
                        <button className="hover:text-cyan-400 transition-colors"><Video size={20} /></button>
                        <button className="hover:text-slate-200 transition-colors"><Info size={20} /></button>
                    </div>
                </div>

                {/* Message Area */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
                    {loading && (
                        <div className="flex items-center justify-center h-full text-slate-500 text-xs gap-2 font-mono uppercase tracking-[0.2em]">
                            <Loader2 className="animate-spin" size={18} /> Establishing secure link...
                        </div>
                    )}
                    {!loading && messages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.isMine ? 'items-end ml-auto' : 'items-start'} max-w-[70%]`}>
                            <div className={`${msg.isMine ? 'bg-cyan-500 text-black rounded-2xl rounded-tr-none shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-none'} p-4 text-sm`}>
                                {msg.content}
                            </div>
                            <span className="text-[9px] text-slate-500 mt-1 font-mono uppercase tracking-[0.2em]">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                    {typingUser && (
                        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">
                            {typingUser} is typing...
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/5 bg-[#0d0e26]/50">
                    <div className="bg-slate-900/50 border border-white/5 focus-within:border-cyan-500/50 rounded-2xl flex items-center px-4 py-2 transition-all">
                        <button className="text-slate-500 hover:text-slate-300 p-2"><Paperclip size={20} /></button>
                        <input
                            type="text"
                            placeholder="Type an encrypted message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4"
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
                        <button className="text-slate-500 hover:text-slate-300 p-2"><Smile size={20} /></button>
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="bg-cyan-500 text-black p-2.5 rounded-xl hover:bg-cyan-400 transition-all ml-2 shadow-[0_0_10px_rgba(34,211,238,0.5)] disabled:opacity-60"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
