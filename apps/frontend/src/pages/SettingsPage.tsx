import { useEffect, useState } from 'react';
import { auth } from '../services/api';
import { Loader2, XCircle } from 'lucide-react';

type Session = {
    id: string;
    deviceId: string | null;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: string;
    lastSeenAt: string;
    revoked: boolean;
};

export const SettingsPage = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await auth.sessions();
                setSessions(res.data);
            } catch (e: any) {
                setError(e.response?.data?.message || 'Failed to load sessions');
            } finally {
                setLoading(false);
            }
        };
        social load();
    }, []);

    const handleRevoke = async (id: string) => {
        setRevokingId(id);
        try {
            await auth.revokeSession(id);
            setSessions(prev => prev.map(s => s.id === id ? { ...s, revoked: true } : s));
        } catch (e) {
            // swallow for now, show minimal feedback
        } finally {
            setRevokingId(null);
        }
    };

    return (
        <div className="mt-8 space-y-6">
            <h2 className="text-xl font-bold tracking-widest uppercase text-slate-400">Security Console</h2>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-slate-500 mb-4">Active Sessions</h3>
                {loading && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase tracking-[0.2em]">
                        <Loader2 className="animate-spin" size={18} /> Scanning devices...
                    </div>
                )}
                {error && (
                    <div className="text-xs text-red-400 font-mono">{error}</div>
                )}
                {!loading && !error && (
                    <div className="space-y-3">
                        {sessions.map(session => (
                            <div key={session.id} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-2xl px-4 py-3">
                                <div className="flex flex-col">
                                    <span className="text-xs font-mono text-slate-300">
                                        {session.userAgent || 'Unknown device'}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">
                                        IP: {session.ipAddress || 'n/a'} • Created: {new Date(session.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {session.revoked && (
                                        <span className="text-[10px] text-red-400 font-mono uppercase tracking-[0.2em]">
                                            Revoked
                                        </span>
                                    )}
                                    {!session.revoked && (
                                        <button
                                            onClick={() => handleRevoke(session.id)}
                                            disabled={revokingId === session.id}
                                            className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.2em] text-red-400 hover:text-red-300"
                                        >
                                            {revokingId === session.id ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                <XCircle size={12} />
                                            )}
                                            Revoke
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">
                                No active sessions detected.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


