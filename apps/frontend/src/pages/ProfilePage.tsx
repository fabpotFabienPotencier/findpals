import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Share, Grid, PlaySquare, Heart, Bookmark, Edit, Zap, Loader2, Link as LinkIcon, Calendar, Lock, CheckCircle2, MessageSquare, User } from 'lucide-react';
import { users, feed } from '../services/api';
import { PostCard, type FeedPost } from './FeedPage';

export const ProfilePage = ({ 
    userProfile, 
    viewUserId, 
    setCurrentPage,
    setActiveChat,
    setViewUserId
}: { 
    userProfile?: any, 
    viewUserId?: string | null, 
    setCurrentPage?: (page: string) => void,
    setActiveChat?: (chat: { id: string; name: string } | null) => void,
    setViewUserId?: (id: string | null) => void
}) => {
    const targetUserId = viewUserId || userProfile?.id;
    const isOwnProfile = !viewUserId || viewUserId === userProfile?.id;

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'live' | 'saved' | 'tagged'>('posts');

    // Follow status
    const [isFollowing, setIsFollowing] = useState(false);
    const [checkingFollow, setCheckingFollow] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            if (!targetUserId) return;
            setLoading(true);
            try {
                const res = await users.getProfile(targetUserId);
                setProfile(res.data);

                // Fetch follow status if viewing someone else
                if (!isOwnProfile) {
                    const followRes = await users.isFollowing(targetUserId);
                    setIsFollowing(followRes.data.isFollowing);
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoading(false);
            }
        };

        const loadPosts = async () => {
            if (!targetUserId) return;
            setLoadingPosts(true);
            try {
                const res = await feed.getUserPosts(targetUserId, 1, 10);
                setPosts(res.data);
            } catch (err) {
                console.error('Failed to load posts:', err);
            } finally {
                setLoadingPosts(false);
            }
        };

        loadProfile();
        loadPosts();
    }, [targetUserId, isOwnProfile]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-blue-500 font-mono text-sm tracking-widest mt-20">
                <Loader2 className="animate-spin mr-2" size={20} /> LOADING PROFILE...
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center mt-20 text-slate-500 font-mono text-sm">
                Profile not found.
            </div>
        );
    }

    const displayName = profile.displayName || profile.username || 'Anonymous';
    const handle = profile.username || 'anonymous';
    const bio = profile.bio || '';
    
    const handleFollowToggle = async () => {
        if (checkingFollow || !targetUserId) return;
        setCheckingFollow(true);
        try {
            if (isFollowing) {
                await users.unfollow(targetUserId);
                setIsFollowing(false);
                setProfile((prev: any) => prev ? { ...prev, followersCount: Math.max(0, prev.followersCount - 1) } : null);
            } else {
                await users.follow(targetUserId);
                setIsFollowing(true);
                setProfile((prev: any) => prev ? { ...prev, followersCount: prev.followersCount + 1 } : null);
            }
        } catch (err) {
            console.error('Failed to toggle follow status:', err);
        } finally {
            setCheckingFollow(false);
        }
    };

    const handleMessageClick = () => {
        if (!profile || !userProfile || !setCurrentPage || !setActiveChat) return;
        const chatPartnerName = profile.displayName || profile.username || 'User';
        const dmChatId = `dm-${[userProfile.id, profile.id].sort().join('-')}`;
        setActiveChat({ id: dmChatId, name: chatPartnerName });
        setCurrentPage('messages');
    };

    const handleShare = () => {
        const url = `${window.location.origin}/profile/${handle}`;
        if (navigator.share) {
            navigator.share({
                title: `${displayName} on FindPals`,
                text: bio || `Check out ${displayName}'s profile on FindPals!`,
                url: url
            }).catch(err => console.error(err));
        } else {
            navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
            });
        }
    };

    return (
        <div className="pb-24">
            {/* Header & Cover Area */}
            <div className="relative h-48 md:h-64 overflow-hidden border-b theme-border bg-gradient-to-tr from-blue-950/40 to-slate-900/10">
                {profile.coverUrl ? (
                    <img 
                        src={profile.coverUrl} 
                        alt="cover" 
                        className="w-full h-full object-cover opacity-60" 
                    />
                ) : (
                    <div className="w-full h-full opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwb2x5Z29uIHBvaW50cz0iMCA0MCA0MCAwIDQwIDQwIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wNSIvPjwvc3ZnPg==')]"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
                
                <div className="absolute top-4 right-4 flex gap-3">
                    <button 
                        onClick={handleShare}
                        className="w-10 h-10 rounded-full bg-black/40 dark:bg-black/60 backdrop-blur border theme-border flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                    >
                        <Share size={18} />
                    </button>
                    {isOwnProfile && (
                        <button 
                            onClick={() => setCurrentPage?.('settings')}
                            className="w-10 h-10 rounded-full bg-black/40 dark:bg-black/60 backdrop-blur border theme-border flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                        >
                            <Settings size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Profile Info */}
            <div className="px-6 -mt-16 relative z-10">
                <div className="flex justify-between items-end mb-4">
                    <div className="relative">
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-black theme-bg-surface overflow-hidden shadow-lg ring-2 ring-blue-500">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-4xl">
                                    {displayName[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        {profile.isCreator && (
                            <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full border-[3px] border-black flex items-center justify-center text-white shadow-[0_0_10px_rgba(0,85,255,0.8)]">
                                <Zap size={14} fill="currentColor" />
                            </div>
                        )}
                    </div>
                    
                    {isOwnProfile ? (
                        <button 
                            onClick={() => setCurrentPage?.('settings')}
                            className="px-6 py-2 rounded-full border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white text-sm font-bold flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors bg-white/50 dark:bg-black/50 backdrop-blur"
                        >
                            <Edit size={14} /> Edit
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button 
                                onClick={handleMessageClick}
                                className="px-5 py-2 rounded-full theme-button-secondary text-sm font-bold flex items-center gap-2 transition-colors"
                            >
                                <MessageSquare size={14} /> Message
                            </button>
                            <button 
                                onClick={handleFollowToggle}
                                disabled={checkingFollow}
                                className={`px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-md ${
                                    isFollowing 
                                        ? 'bg-black/5 dark:bg-white/10 border theme-border hover:bg-black/10 dark:hover:bg-white/20' 
                                        : 'theme-button-accent'
                                }`}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {displayName}
                        {profile.isCreator && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white">
                                ✓
                            </div>
                        )}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-400 text-sm">@{handle}</span>
                        {profile.isCreator && (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                                FindPals+
                            </span>
                        )}
                    </div>
                </div>

                {bio ? (
                    <div className="mt-4 text-sm theme-text-secondary leading-relaxed whitespace-pre-wrap">
                        {bio}
                    </div>
                ) : (
                    <p className="mt-4 text-sm text-slate-600 italic">No bio written yet.</p>
                )}

                <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 text-blue-400 hover:underline cursor-pointer">
                        <LinkIcon size={14} /> findpals.xyz/{handle}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar size={14} /> Joined {new Date(profile.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-8 py-6 border-y theme-border text-center">
                    <div>
                        <div className="text-lg md:text-xl font-bold">{profile.postsCount || 0}</div>
                        <div className="text-[10px] uppercase tracking-wider theme-text-muted mt-1">Posts</div>
                    </div>
                    <div>
                        <div className="text-lg md:text-xl font-bold">{(profile.followersCount || 0).toLocaleString()}</div>
                        <div className="text-[10px] uppercase tracking-wider theme-text-muted mt-1">Followers</div>
                    </div>
                    <div>
                        <div className="text-lg md:text-xl font-bold">{(profile.followingCount || 0).toLocaleString()}</div>
                        <div className="text-[10px] uppercase tracking-wider theme-text-muted mt-1">Following</div>
                    </div>
                </div>

                {/* Share Success Toast Link */}
                {copied && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-mono flex items-center gap-2 justify-center"
                    >
                        <CheckCircle2 size={14} /> Link copied to secure clipboard!
                    </motion.div>
                )}

                {/* Action Buttons (For own profile settings shortcut) */}
                {isOwnProfile && (
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <button 
                            onClick={() => setCurrentPage?.('settings')}
                            className="py-3 theme-button-accent font-bold rounded-2xl shadow-md transition-all text-sm"
                        >
                            Edit Profile
                        </button>
                        <button 
                            onClick={handleShare}
                            className="py-3 theme-button-secondary font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            <Share size={16} /> Share Profile
                        </button>
                    </div>
                )}

                {/* Content Tabs */}
                <div className="flex border-b theme-border mt-6">
                    {[
                        { id: 'posts', icon: Grid, label: 'Posts' },
                        { id: 'reels', icon: PlaySquare, label: 'Reels' },
                        { id: 'live', icon: Zap, label: 'Live' },
                        { id: 'saved', icon: Bookmark, label: 'Saved' },
                        { id: 'tagged', icon: User, label: 'Tagged' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex flex-col items-center gap-2 py-4 border-b-2 transition-colors ${
                                activeTab === tab.id 
                                    ? 'theme-border-accent theme-text-accent' 
                                    : 'border-transparent theme-text-muted hover:theme-text-primary'
                            }`}
                        >
                            <tab.icon size={20} />
                            <span className="text-[10px] uppercase tracking-wider font-bold hidden sm:block">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Posts Feed Area */}
                <div className="mt-6">
                    {activeTab === 'posts' && (
                        <>
                            {loadingPosts ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="animate-spin theme-text-accent" size={24} />
                                </div>
                            ) : posts.length > 0 ? (
                                <div className="space-y-6">
                                    {posts.map(post => (
                                        <PostCard 
                                            key={post.id} 
                                            post={post} 
                                            currentUserId={userProfile?.id} 
                                            setCurrentPage={setCurrentPage}
                                            setViewUserId={setViewUserId}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 theme-text-secondary font-mono text-sm border border-dashed theme-border rounded-3xl">
                                    No posts yet.
                                </div>
                            )}
                        </>
                    )}
                    {activeTab !== 'posts' && (
                        <div className="text-center py-20 theme-text-secondary font-mono text-sm border border-dashed theme-border rounded-3xl flex flex-col items-center gap-4">
                            <Lock size={32} className="theme-text-muted" />
                            This content is currently locked or unavailable.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
