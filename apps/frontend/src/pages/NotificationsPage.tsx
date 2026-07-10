import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { notifications } from '../services/api';

type Notification = {
    id: string;
    type: 'like' | 'comment' | 'follow' | 'system';
    content: string;
    isRead: boolean;
    createdAt: string;
};

export const NotificationsPage = () => {
    const [notifs, setNotifs] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const res = await notifications.list(1, 50);
            setNotifs(res.data);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await notifications.markAllAsRead();
            setNotifs(notifs.map(n => ({ ...n, isRead: true })));
        } catch (e) {
            console.error('Failed to mark all as read', e);
        }
    };

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            await notifications.markAsRead(id);
            setNotifs(notifs.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (e) {
            console.error('Failed to mark as read', e);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart size={20} className="text-pink-500 fill-pink-500" />;
            case 'comment': return <MessageCircle size={20} className="text-blue-500" />;
            case 'follow': return <UserPlus size={20} className="text-green-500" />;
            default: return <Zap size={20} className="text-yellow-500" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full pt-20">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8 pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Bell className="theme-text-accent" /> Notifications
                </h1>
                {notifs.some(n => !n.isRead) && (
                    <button 
                        onClick={handleMarkAllRead}
                        className="text-sm theme-text-accent font-bold transition-colors flex items-center gap-1"
                    >
                        <CheckCircle2 size={16} /> Mark all read
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}

            {notifs.length === 0 ? (
                <div className="text-center py-20 theme-text-secondary border border-dashed theme-border rounded-3xl">
                    <Bell size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-mono text-sm uppercase tracking-widest">You're all caught up!</p>
                    <p className="text-xs mt-2 opacity-60">No new notifications.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifs.map(notification => (
                        <motion.div 
                            key={notification.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
                            className={`p-4 rounded-2xl flex gap-4 cursor-pointer transition-all border ${
                                notification.isRead 
                                    ? 'theme-bg-secondary theme-border opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5' 
                                    : 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15'
                            }`}
                        >
                            <div className="mt-1 flex-shrink-0">
                                {getIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm ${notification.isRead ? 'theme-text-secondary' : 'theme-text-primary font-medium'}`}>
                                    {notification.content}
                                </p>
                                <div className="text-[10px] theme-text-muted uppercase tracking-wider mt-2 flex items-center gap-2">
                                    {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    {!notification.isRead && (
                                        <span className="w-2 h-2 rounded-full theme-bg-accent animate-pulse shadow-[0_0_8px_var(--findpals-accent)]" />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
