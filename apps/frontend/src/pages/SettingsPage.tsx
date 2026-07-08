import { useEffect, useState } from 'react';
import { auth, users, upload } from '../services/api';
import { Loader2, XCircle, Camera, Check } from 'lucide-react';

type Session = {
    id: string;
    deviceId: string | null;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: string;
    lastSeenAt: string;
    revoked: boolean;
};

export const SettingsPage = ({ 
    userProfile, 
    onProfileUpdate 
}: { 
    userProfile: any, 
    onProfileUpdate?: () => void 
}) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [sessionsError, setSessionsError] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    // Profile state
    const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
    const [bio, setBio] = useState(userProfile?.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || '');
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [showSuccessBadge, setShowSuccessBadge] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || '');
            setBio(userProfile.bio || '');
            setAvatarUrl(userProfile.avatarUrl || '');
        }
    }, [userProfile]);

    useEffect(() => {
        const load = async () => {
            setLoadingSessions(true);
            setSessionsError(null);
            try {
                const res = await auth.sessions();
                setSessions(res.data);
            } catch (e: any) {
                setSessionsError(e.response?.data?.message || 'Failed to load sessions');
            } finally {
                setLoadingSessions(false);
            }
        };
        load();
    }, []);

    const handleRevoke = async (id: string) => {
        setRevokingId(id);
        try {
            await auth.revokeSession(id);
            setSessions(prev => prev.map(s => s.id === id ? { ...s, revoked: true } : s));
        } catch (e) {
            // swallow for now
        } finally {
            setRevokingId(null);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        try {
            const url = await upload.uploadFile(file, 'avatars');
            setAvatarUrl(url);
        } catch (err) {
            console.error('Failed to upload avatar:', err);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        setShowSuccessBadge(false);
        try {
            await users.updateProfile({ displayName, bio, avatarUrl });
            if (onProfileUpdate) onProfileUpdate();
            setShowSuccessBadge(true);
            setTimeout(() => setShowSuccessBadge(false), 3000);
        } catch (err) {
            console.error('Failed to save profile:', err);
        } finally {
            setSavingProfile(false);
        }
    };

    return (
        <div className="mt-8 space-y-8">
            <h2 className="text-xl font-bold tracking-widest uppercase text-slate-400">Settings Console</h2>
            
            {/* Profile Settings Section */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-slate-500 mb-6">Edit Profile</h3>
                
                <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="relative w-24 h-24 rounded-full bg-slate-800 border-2 border-cyan-500/30 flex items-center justify-center overflow-hidden group">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <Camera size={24} className="text-slate-500" />
                            )}
                            <label className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={18} className="text-white" />
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </label>
                            {uploadingAvatar && (
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                    <Loader2 size={16} className="animate-spin text-cyan-400" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 w-full space-y-4">
                            <div>
                                <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="your alias"
                                    className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Bio</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="write your cyber manifesto..."
                                    rows={3}
                                    className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 justify-end">
                        {showSuccessBadge && (
                            <span className="text-xs font-mono text-green-400 flex items-center gap-1 animate-pulse">
                                <Check size={14} /> Profile saved successfully
                            </span>
                        )}
                        <button
                            type="submit"
                            disabled={savingProfile || uploadingAvatar}
                            className="px-6 py-2 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50 text-sm"
                        >
                            {savingProfile ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Sessions Section */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-slate-500 mb-4">Active Sessions</h3>
                {loadingSessions && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase tracking-[0.2em]">
                        <Loader2 className="animate-spin" size={18} /> Scanning devices...
                    </div>
                )}
                {sessionsError && (
                    <div className="text-xs text-red-400 font-mono">{sessionsError}</div>
                )}
                {!loadingSessions && !sessionsError && (
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


