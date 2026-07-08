import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Share, Grid, PlaySquare, Heart, Bookmark, Edit, Zap, Loader2, MapPin, Link as LinkIcon, Calendar, Plus, User, MoreHorizontal, Lock } from 'lucide-react';
import { users, feed } from '../services/api';
import { PostCard, type FeedPost } from './FeedPage';

export const ProfilePage = ({ userProfile, setCurrentPage }: { userProfile?: any, setCurrentPage?: (page: string) => void }) => {
    const [profile, setProfile] = useState<any>(userProfile);
    const [loading, setLoading] = useState(!userProfile);
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'live' | 'saved' | 'tagged'>('posts');

    useEffect(() => {
        const loadProfile = async () => {
            if (!userProfile?.id) return;
            try {
                const res = await users.getProfile(userProfile.id);
                setProfile(res.data);
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoading(false);
            }
        };

        const loadPosts = async () => {
            if (!userProfile?.id) return;
            setLoadingPosts(true);
            try {
                const res = await feed.getUserPosts(userProfile.id, 1, 10);
                setPosts(res.data);
            } catch (err) {
                console.error('Failed to load posts:', err);
            } finally {
                setLoadingPosts(false);
            }
        };

        if (userProfile?.id) {
            loadProfile();
            loadPosts();
        }
    }, [userProfile?.id]);

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
                Profile not found or not logged in.
            </div>
        );
    }

    const displayName = profile.displayName || profile.username || 'Anonymous';
    const handle = profile.username || 'anonymous';
    const bio = profile.bio || 'Dreamer | Creator | Believer\nTurning ideas into reality.';
    
    return (
        <div className="pb-24">
            {/* Header & Cover Area */}
            <div className="relative h-48 md:h-64 overflow-hidden border-b border-white/5 bg-gradient-to-tr from-blue-900 to-black">
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
                    <button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                        <Share size={18} />
                    </button>
                    {userProfile?.id === profile.id && (
                        <button 
                            onClick={() => setCurrentPage?.('settings')}
                            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
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
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-black bg-slate-900 overflow-hidden shadow-[0_0_20px_rgba(0,85,255,0.4)] ring-2 ring-blue-500">
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
                    
                    {userProfile?.id === profile.id ? (
                        <button 
                            onClick={() => setCurrentPage?.('settings')}
                            className="px-6 py-2 rounded-full border border-white/20 text-white text-sm font-bold flex items-center gap-2 hover:bg-white/5 transition-colors bg-black/50 backdrop-blur"
                        >
                            <Edit size={14} /> Edit
                        </button>
                    ) : (
                        <button className="px-6 py-2 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-blue-500 transition-colors shadow-[0_0_10px_rgba(0,85,255,0.3)]">
                            Follow
                        </button>
                    )}
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
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

                {profile.bio && (
                    <div className="mt-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {profile.bio}
                    </div>
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
                <div className="grid grid-cols-3 gap-4 mt-8 py-6 border-y border-white/10 text-center">
                    <div>
                        <div className="text-lg md:text-xl font-bold text-white">{profile.postsCount || posts.length || 0}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Posts</div>
                    </div>
                    <div>
                        <div className="text-lg md:text-xl font-bold text-white">{(profile.followersCount || 0).toLocaleString()}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Followers</div>
                    </div>
                    <div>
                        <div className="text-lg md:text-xl font-bold text-white">{(profile.followingCount || 0).toLocaleString()}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Following</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <button 
                        onClick={() => setCurrentPage?.('settings')}
                        className="py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-[0_0_15px_rgba(0,85,255,0.3)] transition-all"
                    >
                        Edit Profile
                    </button>
                    <button className="py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
                        <Share size={16} /> Share Profile
                    </button>
                </div>

                {/* Story Highlights (Coming Soon) */}
                {profile.highlights && profile.highlights.length > 0 && (
                    <div className="flex gap-4 mt-8 overflow-x-auto custom-scrollbar pb-4 -mx-6 px-6 snap-x">
                        {/* Dynamic highlights will go here */}
                    </div>
                )}

                {/* Content Tabs */}
                <div className="flex border-b border-white/10 mt-4">
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
                                    ? 'border-blue-500 text-blue-500' 
                                    : 'border-transparent text-slate-500 hover:text-slate-300'
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
                                    <Loader2 className="animate-spin text-blue-500" size={24} />
                                </div>
                            ) : posts.length > 0 ? (
                                <div className="space-y-6">
                                    {posts.map(post => (
                                        <PostCard key={post.id} post={post} currentUserId={userProfile?.id} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-500 font-mono text-sm border border-dashed border-white/10 rounded-3xl">
                                    No posts yet.
                                </div>
                            )}
                        </>
                    )}
                    {activeTab !== 'posts' && (
                        <div className="text-center py-20 text-slate-500 font-mono text-sm border border-dashed border-white/10 rounded-3xl flex flex-col items-center gap-4">
                            <Lock size={32} className="text-slate-700" />
                            This content is currently locked or unavailable.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

