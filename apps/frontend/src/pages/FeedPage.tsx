import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, Zap, Loader2, Trash2, Camera, CheckCircle2, Lock } from 'lucide-react';
import { feed, upload, messaging } from '../services/api';
import { secureStorage } from '../utils/secureStorage';

export type FeedPost = {
    id: string;
    content: string | null;
    mediaUrl?: string | null;
    type: 'post' | 'reel' | 'story';
    likesCount: number;
    createdAt: string;
    isLocked: boolean;
    price: number;
    lockedForUser?: boolean;
    author?: {
        id: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
        isCreator?: boolean;
    };
};

export const PostCard = ({ 
    post, 
    currentUserId,
    setCurrentPage,
    setViewUserId,
    onDeleteSuccess
}: { 
    post: FeedPost; 
    currentUserId?: string | null;
    setCurrentPage?: (page: string) => void;
    setViewUserId?: (id: string) => void;
    onDeleteSuccess?: (postId: string) => void;
}) => {
    const authorName = post.author?.displayName || post.author?.username || 'Unknown';
    const authorHandle = post.author?.username || 'anonymous';
    const avatarUrl = post.author?.avatarUrl;

    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likesCount || 0);

    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newCommentText, setNewCommentText] = useState('');
    const [commenting, setCommenting] = useState(false);

    const [unlocking, setUnlocking] = useState(false);
    const [unlockError, setUnlockError] = useState<string | null>(null);

    const handleUnlock = async () => {
        setUnlocking(true);
        setUnlockError(null);
        try {
            await feed.unlockPost(post.id);
            window.location.reload();
        } catch (err: any) {
            setUnlockError(err.response?.data?.message || 'Unlock failed');
        } finally {
            setUnlocking(false);
        }
    };

    // Dropdown / Actions menu
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [copied, setCopied] = useState(false);

    // Load initial like status
    useEffect(() => {
        const checkLikeStatus = async () => {
            if (!currentUserId) return;
            try {
                const res = await feed.isLiked(post.id);
                setIsLiked(res.data.isLiked);
            } catch (err) {
                console.error('Failed to get like status:', err);
            }
        };
        checkLikeStatus();
    }, [post.id, currentUserId]);

    const handleToggleComments = async () => {
        if (!showComments) {
            setLoadingComments(true);
            try {
                const res = await feed.getComments(post.id);
                setComments(res.data);
            } catch (err) {
                console.error('Failed to load comments:', err);
            } finally {
                setLoadingComments(false);
            }
        }
        setShowComments(!showComments);
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentText.trim() || commenting || !currentUserId) return;
        setCommenting(true);
        try {
            const res = await feed.comment(post.id, currentUserId, newCommentText.trim());
            setComments(prev => [...prev, res.data]);
            setNewCommentText('');
        } catch (err) {
            console.error('Failed to add comment:', err);
        } finally {
            setCommenting(false);
        }
    };

    const handleLikeToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUserId) return;

        const originalLiked = isLiked;
        const originalCount = likesCount;

        // Optimistic update
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            if (originalLiked) {
                await feed.unlikePost(post.id);
            } else {
                await feed.likePost(post.id);
            }
        } catch (err) {
            // Rollback on error
            setIsLiked(originalLiked);
            setLikesCount(originalCount);
            console.error('Failed to toggle like:', err);
        }
    };

    const handleDeletePost = async () => {
        if (deleting || !currentUserId) return;
        setDeleting(true);
        try {
            await feed.deletePost(post.id);
            if (onDeleteSuccess) {
                onDeleteSuccess(post.id);
            }
        } catch (err) {
            console.error('Failed to delete post:', err);
        } finally {
            setDeleting(false);
            setShowActionsMenu(false);
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}/post/${post.id}`;
        if (navigator.share) {
            navigator.share({
                title: 'FindPals Post',
                text: post.content || 'Check out this post on FindPals!',
                url: url
            }).catch(err => console.error(err));
        } else {
            navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const handleProfileClick = () => {
        if (!post.author?.id || !setCurrentPage || !setViewUserId) return;
        setViewUserId(post.author.id);
        setCurrentPage('view-profile');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="theme-card rounded-3xl p-6 mb-6 transition-all relative"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div onClick={handleProfileClick} className="cursor-pointer">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover border border-white/10" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold font-mono">
                                {authorName[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <div 
                            onClick={handleProfileClick}
                            className="font-bold text-white flex items-center gap-2 cursor-pointer hover:underline"
                        >
                            {authorName}
                            {post.author?.isCreator && (
                                <span className="w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center text-[10px] text-black">
                                    <Zap size={10} fill="currentColor" />
                                </span>
                            )}
                        </div>
                        <div 
                            onClick={handleProfileClick}
                            className="text-xs text-slate-500 font-mono italic cursor-pointer hover:underline"
                        >
                            @{authorHandle}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <button 
                        onClick={() => setShowActionsMenu(!showActionsMenu)}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <MoreHorizontal size={20} />
                    </button>
                    {showActionsMenu && (
                        <div className="absolute right-0 mt-2 w-48 theme-card rounded-2xl p-2 shadow-2xl z-20">
                            {post.author?.id === currentUserId ? (
                                <button
                                    onClick={handleDeletePost}
                                    disabled={deleting}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider text-red-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
                                >
                                    {deleting ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={14} />
                                    )}
                                    Delete Post
                                </button>
                            ) : (
                                <p className="text-[10px] font-mono text-slate-500 px-3 py-2 uppercase">No actions available</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {post.content && (
                <p className="theme-text-secondary leading-relaxed mb-4 whitespace-pre-wrap">
                    {post.content}
                </p>
            )}

            {post.isLocked && post.lockedForUser ? (
                <div className="rounded-2xl overflow-hidden mb-4 border theme-border aspect-video bg-black/40 dark:bg-black/60 relative flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl">
                    <div className="w-16 h-16 rounded-full theme-bg-surface border theme-border flex items-center justify-center mb-4 relative shadow-[0_0_20px_rgba(0,85,255,0.2)]">
                        <span className="w-12 h-12 rounded-full border border-blue-500/20 absolute animate-ping pointer-events-none" />
                        <Zap size={24} className="theme-text-accent animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Premium Creator Content</h3>
                    <p className="text-xs theme-text-muted mb-4">Unlock this exclusive post from @{authorHandle} to view full media.</p>
                    <button
                        disabled={unlocking}
                        onClick={handleUnlock}
                        className="px-6 py-2.5 theme-button-accent text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(0,85,255,0.4)] hover:scale-105"
                    >
                        {unlocking ? <Loader2 size={12} className="animate-spin" /> : `Unlock for $${Number(post.price).toFixed(2)}`}
                    </button>
                    {unlockError && (
                        <p className="text-[10px] text-red-500 font-mono mt-2">{unlockError}</p>
                    )}
                </div>
            ) : (
                post.mediaUrl && (
                    <div className="rounded-2xl overflow-hidden mb-4 border theme-border aspect-video theme-bg-surface flex items-center justify-center">
                        <img src={post.mediaUrl} alt="Post content" className="w-full h-full object-cover" />
                    </div>
                )
            )}

            <div className="flex items-center gap-6 pt-4 border-t theme-border">
                <button 
                    onClick={handleLikeToggle}
                    className={`flex items-center gap-2 transition-colors group ${isLiked ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}
                >
                    <Heart size={20} className={isLiked ? 'fill-pink-500' : 'group-hover:fill-pink-500'} />
                    <span className="text-sm">{likesCount}</span>
                </button>
                <button 
                    onClick={handleToggleComments}
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors"
                >
                    <MessageCircle size={20} />
                    <span className="text-sm">{comments.length || 'Comments'}</span>
                </button>
                <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors relative"
                >
                    <Share2 size={20} />
                    <span className="text-xs">{copied ? 'Copied!' : ''}</span>
                </button>
            </div>

            {/* Interactive Comments Container */}
            {showComments && (
                <div className="mt-6 pt-6 border-t theme-border space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500">Comments</h4>
                    {loadingComments ? (
                        <div className="flex justify-center py-2">
                            <Loader2 className="animate-spin text-slate-500" size={16} />
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {comments.map((c: any) => {
                                const cAuthorName = c.author?.displayName || c.author?.username || 'Anonymous';
                                return (
                                    <div key={c.id} className="flex gap-3 text-sm items-start">
                                        {c.author?.avatarUrl ? (
                                            <img src={c.author.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover mt-0.5" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white font-mono mt-0.5">
                                                {cAuthorName[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 bg-white/5 rounded-2xl px-4 py-2 border border-white/5">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                                    {cAuthorName}
                                                    {c.author?.isCreator && (
                                                        <span className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white">✓</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    {new Date(c.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-300 text-xs leading-relaxed">{c.content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {comments.length === 0 && (
                                <div className="text-xs text-slate-600 font-mono italic">No comments yet. Be the first!</div>
                            )}
                        </div>
                    )}

                    {/* Add comment form */}
                    {currentUserId ? (
                        <form onSubmit={handleSubmitComment} className="flex gap-2 mt-4 pt-2">
                            <input
                                type="text"
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1 bg-[#0a0b1e]/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={commenting || !newCommentText.trim()}
                                className="px-4 py-2 bg-blue-500 text-black text-xs font-bold rounded-xl hover:bg-blue-400 transition-all disabled:opacity-50"
                            >
                                {commenting ? '...' : 'Reply'}
                            </button>
                        </form>
                    ) : (
                        <div className="text-[10px] text-slate-600 font-mono uppercase">Please log in to add comments</div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export const FeedPage = ({ 
    userProfile, 
    setCurrentPage, 
    setViewUserId 
}: { 
    userProfile?: any;
    setCurrentPage?: (page: string) => void;
    setViewUserId?: (id: string) => void;
}) => {
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [composerText, setComposerText] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [isPremium, setIsPremium] = useState(false);
    const [premiumPrice, setPremiumPrice] = useState('4.99');

    // Stories state
    const [stories, setStories] = useState<any[]>([]);
    const [loadingStories, setLoadingStories] = useState(false);
    const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
    const [storyUploadOpen, setStoryUploadOpen] = useState(false);
    const [storyMediaUrl, setStoryMediaUrl] = useState<string | null>(null);
    const [storyText, setStoryText] = useState('');
    const [storyIsPremium, setStoryIsPremium] = useState(false);
    const [storyPrice, setStoryPrice] = useState('2.99');
    const [uploadingStoryMedia, setUploadingStoryMedia] = useState(false);
    const [creatingStory, setCreatingStory] = useState(false);
    const [unlocking, setUnlocking] = useState(false);
    const [storySuccessMessage, setStorySuccessMessage] = useState<string | null>(null);

    const currentUserId = userProfile?.id || null;

    const handleSendStoryReply = async (story: any, replyText: string) => {
        if (!replyText.trim() || !currentUserId || !story.author?.id) return;
        const chatId = `dm-${[currentUserId, story.author.id].sort().join('-')}`;
        try {
            await messaging.sendMessage(chatId, replyText, 'text');
            setStorySuccessMessage('Reply sent!');
            setTimeout(() => setStorySuccessMessage(null), 2000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to send reply');
        }
    };

    const handleSendStoryReaction = async (story: any) => {
        if (!currentUserId || !story.author?.id) return;
        const chatId = `dm-${[currentUserId, story.author.id].sort().join('-')}`;
        try {
            await messaging.sendMessage(chatId, "❤️", 'text');
            setStorySuccessMessage('Reaction sent!');
            setTimeout(() => setStorySuccessMessage(null), 2000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to send reaction');
        }
    };
    const [attachedMediaUrl, setAttachedMediaUrl] = useState<string | null>(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canPost = useMemo(() => composerText.trim().length > 0 || !!attachedMediaUrl, [composerText, attachedMediaUrl]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await feed.list(page, 10);
                const fetched: FeedPost[] = res.data;
                setPosts(prev => page === 1 ? fetched : [...prev, ...fetched]);
                if (fetched.length < 10) setHasMore(false);
            } catch (e: any) {
                setError(e.response?.data?.message || 'Failed to load feed');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [page]);

    useEffect(() => {
        const fetchStories = async () => {
            setLoadingStories(true);
            try {
                const res = await feed.getStories();
                setStories(res.data);
            } catch (err) {
                console.error('Failed to fetch stories:', err);
            } finally {
                setLoadingStories(false);
            }
        };
        fetchStories();
    }, []);

    const handleCreatePost = async () => {
        if (!canPost || creating) return;
        setCreating(true);
        setError(null);
        try {
            const token = await secureStorage.getItem('auth_token');
            let authorId: string | null = null;
            if (token) {
                const [, payloadBase64] = token.split('.');
                const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
                const payload = JSON.parse(payloadJson);
                authorId = payload.sub;
            }

            if (!authorId) {
                throw new Error('Unable to resolve user identity from token.');
            }

            const res = await feed.create(
                authorId, 
                composerText.trim(), 
                'post', 
                attachedMediaUrl || undefined,
                isPremium,
                isPremium ? Number(premiumPrice) : 0
            );
            setComposerText('');
            setAttachedMediaUrl(null);
            setIsPremium(false);
            
            // Add freshly created post with local author details
            const newPost: FeedPost = {
                ...res.data,
                author: {
                    id: authorId,
                    username: userProfile?.username || 'anonymous',
                    displayName: userProfile?.displayName,
                    avatarUrl: userProfile?.avatarUrl,
                    isCreator: userProfile?.isCreator,
                }
            };
            setPosts(prev => [newPost, ...prev]);
        } catch (e: any) {
            setError(e.response?.data?.message || e.message || 'Failed to create post');
        } finally {
            setCreating(false);
        }
    };

    const handleStoryMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingStoryMedia(true);
        try {
            const url = await upload.uploadFile(file, 'stories');
            setStoryMediaUrl(url);
        } catch (err) {
            console.error('Failed to upload story media:', err);
        } finally {
            setUploadingStoryMedia(false);
        }
    };

    const handleCreateStory = async () => {
        if (!storyMediaUrl || creatingStory) return;
        setCreatingStory(true);
        try {
            const token = await secureStorage.getItem('auth_token');
            let authorId: string | null = null;
            if (token) {
                const [, payloadBase64] = token.split('.');
                const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
                const payload = JSON.parse(payloadJson);
                authorId = payload.sub;
            }
            if (!authorId) throw new Error('Not authenticated');

            const res = await feed.create(
                authorId,
                storyText.trim(),
                'story',
                storyMediaUrl,
                storyIsPremium,
                storyIsPremium ? Number(storyPrice) : 0
            );

            const newStory = {
                ...res.data,
                author: {
                    id: authorId,
                    username: userProfile?.username || 'anonymous',
                    displayName: userProfile?.displayName,
                    avatarUrl: userProfile?.avatarUrl,
                    isCreator: userProfile?.isCreator,
                }
            };
            setStories(prev => [newStory, ...prev]);

            setStoryMediaUrl(null);
            setStoryText('');
            setStoryIsPremium(false);
            setStoryUploadOpen(false);
        } catch (err) {
            console.error('Failed to create story:', err);
        } finally {
            setCreatingStory(false);
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingMedia(true);
        setError(null);
        try {
            const url = await upload.uploadFile(file, 'posts');
            setAttachedMediaUrl(url);
        } catch (err: any) {
            setError('Failed to upload media. Please try again.');
            console.error(err);
        } finally {
            setUploadingMedia(false);
        }
    };

    const handlePostDeleteSuccess = (postId: string) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
    };

    return (
        <div className="mt-8">
            {/* Horizontal Stories bar */}
            <div className="mb-6 overflow-hidden">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                    {/* Add own Story button for creators */}
                    {userProfile?.isCreator && (
                        <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer" onClick={() => setStoryUploadOpen(true)}>
                            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-dashed theme-border flex items-center justify-center relative hover:scale-105 transition-all">
                                {userProfile.avatarUrl ? (
                                    <img src={userProfile.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-white text-lg font-bold">{(userProfile.displayName || userProfile.username)[0].toUpperCase()}</span>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white border-2 border-[var(--bg-secondary)]">
                                    <span className="text-sm font-bold">+</span>
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono mt-1">Add Story</span>
                        </div>
                    )}

                    {/* Stories items */}
                    {stories.map((story, idx) => {
                        const sAuthorName = story.author?.displayName || story.author?.username || 'User';
                        const sAvatar = story.author?.avatarUrl;
                        return (
                            <div key={story.id} className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer" onClick={() => setActiveStoryIndex(idx)}>
                                <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-pink-500 via-purple-500 to-orange-500 hover:scale-105 transition-all">
                                    <div className="w-full h-full rounded-full bg-[var(--bg-secondary)] p-[2px]">
                                        {sAvatar ? (
                                            <img src={sAvatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-bold font-mono">
                                                {sAuthorName[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-300 font-mono mt-1 max-w-[70px] truncate text-center">{sAuthorName}</span>
                            </div>
                        );
                    })}

                    {stories.length === 0 && !userProfile?.isCreator && (
                        <div className="text-xs text-slate-600 font-mono italic flex items-center h-16 pl-2">No active stories available</div>
                    )}
                </div>
            </div>
            {/* Create Post Area */}
            <div className="theme-card rounded-3xl p-6 mb-8">
                <div className="flex gap-4">
                    {userProfile?.avatarUrl ? (
                        <img src={userProfile.avatarUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover border border-white/10" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white">
                            {(userProfile?.displayName || userProfile?.username || '?')[0].toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1">
                        <textarea
                            placeholder="What's happening in the social?"
                            className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none placeholder:text-slate-600 pt-2 focus:outline-none"
                            rows={2}
                            value={composerText}
                            onChange={e => setComposerText(e.target.value)}
                        />
                        {/* Preview attached media */}
                        {attachedMediaUrl && (
                            <div className="mt-3 relative rounded-2xl overflow-hidden aspect-video theme-bg-surface border theme-border group max-h-48">
                                <img src={attachedMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => setAttachedMediaUrl(null)}
                                    className="absolute top-2 right-2 bg-black/75 hover:bg-black/90 p-1.5 rounded-full text-white transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {error && (
                    <div className="mt-2 text-xs text-red-400 font-mono">
                        {error}
                    </div>
                )}
                <div className="flex justify-between items-center mt-4 pt-4 border-t theme-border">
                    <div className="flex gap-4">
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingMedia}
                            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5"
                        >
                            <Camera size={16} />
                            <span className="text-xs font-mono uppercase tracking-tighter">
                                {uploadingMedia ? 'Uploading...' : 'Media'}
                            </span>
                        </button>
                        <input 
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleMediaUpload}
                        />
                        <button className="text-slate-500 hover:text-white transition-colors text-xs font-mono uppercase tracking-tighter mr-2">Poll</button>
                        {userProfile?.isCreator && (
                            <div className="flex items-center gap-2 border-l theme-border pl-4">
                                <label className="flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-white transition-colors">
                                    <input 
                                        type="checkbox"
                                        checked={isPremium}
                                        onChange={(e) => setIsPremium(e.target.checked)}
                                        className="rounded border-white/10 bg-transparent text-blue-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                                    />
                                    <span className="text-xs font-mono uppercase tracking-tighter">Premium</span>
                                </label>
                                {isPremium && (
                                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5">
                                        <span className="text-[10px] text-slate-500 font-mono">$</span>
                                        <input 
                                            type="number"
                                            value={premiumPrice}
                                            onChange={(e) => setPremiumPrice(e.target.value)}
                                            className="w-12 bg-transparent border-none p-0 text-[10px] text-white font-mono focus:ring-0 focus:outline-none"
                                            placeholder="4.99"
                                            step="0.01"
                                            min="0.10"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleCreatePost}
                        disabled={!canPost || creating || uploadingMedia}
                        className="px-6 py-2 theme-button-accent font-bold rounded-full transition-all disabled:opacity-60 flex items-center gap-2"
                    >
                        {creating && <Loader2 size={16} className="animate-spin" />}
                        <span>Post</span>
                    </button>
                </div>
            </div>

            {/* Posts Feed */}
            {posts.map(post => (
                <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUserId={currentUserId} 
                    setCurrentPage={setCurrentPage} 
                    setViewUserId={setViewUserId}
                    onDeleteSuccess={handlePostDeleteSuccess}
                />
            ))}

            <div className="flex justify-center py-6">
                {loading && (
                    <Loader2 className="animate-spin text-slate-400" size={22} />
                )}
                {!loading && hasMore && (
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] theme-button-secondary rounded-full"
                    >
                        Load more
                    </button>
                )}
                {!loading && !hasMore && posts.length > 0 && (
                    <span className="text-xs text-slate-500 font-mono uppercase tracking-[0.2em]">
                        End of feed
                    </span>
                )}
            </div>

            {/* Story Creator Modal */}
            {storyUploadOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="theme-card rounded-3xl p-6 max-w-md w-full border theme-border">
                        <h3 className="text-lg font-bold theme-text-primary mb-4 uppercase tracking-wider font-mono">Create New Story</h3>
                        
                        <div className="space-y-4">
                            {/* File selector or preview */}
                            {storyMediaUrl ? (
                                <div className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-black max-h-[300px] flex items-center justify-center">
                                    <img src={storyMediaUrl} alt="Story content" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setStoryMediaUrl(null)}
                                        className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 p-1.5 rounded-full text-white text-xs font-mono"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed theme-border rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all min-h-[200px]" onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e: any) => handleStoryMediaUpload(e);
                                    input.click();
                                }}>
                                    {uploadingStoryMedia ? (
                                        <Loader2 className="animate-spin text-blue-400 mb-2" size={24} />
                                    ) : (
                                        <Camera className="theme-text-accent mb-2" size={28} />
                                    )}
                                    <span className="text-xs theme-text-muted font-mono text-center">
                                        {uploadingStoryMedia ? 'Uploading image...' : 'Click to upload story image'}
                                    </span>
                                </div>
                            )}

                            {/* Caption input */}
                            <div>
                                <label className="text-[10px] uppercase font-mono tracking-wider theme-text-muted block mb-1">Caption (optional)</label>
                                <input
                                    type="text"
                                    value={storyText}
                                    onChange={(e) => setStoryText(e.target.value)}
                                    className="w-full theme-input rounded-xl px-4 py-2.5 text-xs focus:border-blue-500 focus:outline-none transition-colors"
                                    placeholder="Type a story caption..."
                                />
                            </div>

                            {/* Premium toggle */}
                            <div className="flex justify-between items-center theme-bg-surface p-3 rounded-xl border theme-border">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={storyIsPremium}
                                        onChange={(e) => setStoryIsPremium(e.target.checked)}
                                        className="rounded border-white/10 bg-transparent text-blue-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                                    />
                                    <div>
                                        <span className="text-xs font-bold theme-text-primary block">Premium Story</span>
                                        <span className="text-[10px] theme-text-muted font-mono">Unlock via wallet balance</span>
                                    </div>
                                </label>

                                {storyIsPremium && (
                                    <div className="flex items-center gap-1 theme-bg-surface border theme-border rounded-lg px-2.5 py-1">
                                        <span className="text-xs theme-text-muted font-mono">$</span>
                                        <input
                                            type="number"
                                            value={storyPrice}
                                            onChange={(e) => setStoryPrice(e.target.value)}
                                            className="w-14 bg-transparent border-none p-0 text-xs theme-text-primary font-mono focus:ring-0 focus:outline-none"
                                            placeholder="2.99"
                                            step="0.01"
                                            min="0.10"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t theme-border">
                            <button
                                disabled={creatingStory || uploadingStoryMedia}
                                onClick={() => setStoryUploadOpen(false)}
                                className="flex-1 py-2.5 border theme-border hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider rounded-xl theme-text-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={creatingStory || uploadingStoryMedia || !storyMediaUrl}
                                onClick={handleCreateStory}
                                className="flex-1 py-2.5 theme-button-accent text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {creatingStory && <Loader2 size={12} className="animate-spin" />}
                                Post Story
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Story Viewer Modal */}
            {activeStoryIndex !== null && stories[activeStoryIndex] && (() => {
                const activeStory = stories[activeStoryIndex];
                const sAuthor = activeStory.author || {};
                const sAuthorName = sAuthor.displayName || sAuthor.username || 'User';
                const sAvatar = sAuthor.avatarUrl;
                const handlePrev = () => {
                    if (activeStoryIndex > 0) setActiveStoryIndex(activeStoryIndex - 1);
                };
                const handleNext = () => {
                    if (activeStoryIndex < stories.length - 1) {
                        setActiveStoryIndex(activeStoryIndex + 1);
                    } else {
                        setActiveStoryIndex(null);
                    }
                };

                return (
                    <div className="fixed inset-0 bg-[#020208] z-[100] flex items-center justify-center select-none">
                        {/* Background Blurry Glow */}
                        {activeStory.mediaUrl && (
                            <img src={activeStory.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-25 scale-110 pointer-events-none" />
                        )}

                        {/* Central Phone mock frame */}
                        <div className="relative w-full max-w-lg aspect-[9/16] bg-black/60 md:border md:theme-border md:rounded-3xl overflow-hidden flex flex-col justify-between shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                            {storySuccessMessage && (
                                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg z-50 animate-pulse">
                                    {storySuccessMessage}
                                </div>
                            )}
                            {/* Top Bar (Progress line + Profile details) */}
                            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20">
                                {/* Segmented progress bar */}
                                <div className="flex gap-1 mb-3">
                                    {stories.map((s, idx) => (
                                        <div key={s.id} className="flex-1 h-[2.5px] rounded bg-white/20 overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-[5000ms] ease-linear ${
                                                    idx < activeStoryIndex ? 'w-full bg-white' : idx === activeStoryIndex ? 'w-full bg-white shadow-[0_0_8px_#ffffff]' : 'w-0'
                                                }`}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Profile Header */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2.5">
                                        {sAvatar ? (
                                            <img src={sAvatar} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-white/20" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold font-mono">
                                                {sAuthorName[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <span className="font-bold text-white text-xs block">{sAuthorName}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">@{sAuthor.username || 'anonymous'}</span>
                                        </div>
                                    </div>

                                    <button onClick={() => setActiveStoryIndex(null)} className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Middle Content (Story Media) */}
                            <div className="flex-1 flex items-center justify-center relative bg-black/10">
                                {activeStory.isLocked && activeStory.lockedForUser ? (
                                    <div className="flex flex-col items-center justify-center p-6 text-center text-white max-w-sm">
                                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                            <Lock size={24} className="text-pink-500 animate-pulse" />
                                        </div>
                                        <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Premium Ephemeral Story</h3>
                                        <p className="text-xs text-slate-400 mb-4">Support the creator to view this exclusive story media.</p>
                                        <button
                                            disabled={unlocking}
                                            onClick={async () => {
                                                setUnlocking(true);
                                                try {
                                                    await feed.unlockPost(activeStory.id);
                                                    const res = await feed.getStories();
                                                    setStories(res.data);
                                                } catch (err: any) {
                                                    alert(err.response?.data?.message || 'Failed to unlock');
                                                } finally {
                                                    setUnlocking(false);
                                                }
                                            }}
                                            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(239,68,68,0.4)]"
                                        >
                                            {unlocking ? <Loader2 size={12} className="animate-spin" /> : `Unlock for $${Number(activeStory.price).toFixed(2)}`}
                                        </button>
                                    </div>
                                ) : (
                                    activeStory.mediaUrl && (
                                        <img src={activeStory.mediaUrl} alt="Story Content" className="w-full h-full object-contain animate-fade-in" />
                                    )
                                )}

                                {/* Optional text caption overlay */}
                                {activeStory.content && (
                                    <div className="absolute bottom-6 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-center z-10">
                                        <p className="text-white text-sm font-medium leading-relaxed drop-shadow-md">
                                            {activeStory.content}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Input Area / Quick Replies */}
                            <div className="p-4 bg-gradient-to-t from-black/90 to-transparent z-20 flex gap-3 items-center">
                                <input
                                    type="text"
                                    placeholder="Send a private reply..."
                                    className="flex-1 bg-white/10 hover:bg-white/15 focus:bg-white/20 border-none rounded-full px-5 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-0 transition-all"
                                    onKeyDown={(e: any) => {
                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                            handleSendStoryReply(activeStory, e.target.value.trim());
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <button onClick={() => {
                                    handleSendStoryReaction(activeStory);
                                }} className="text-pink-500 hover:scale-110 transition-all p-2 bg-white/10 rounded-full">
                                    <Heart size={16} fill="currentColor" />
                                </button>
                            </div>

                            {/* Left / Right touch navigation overlays */}
                            <div className="absolute top-1/4 bottom-1/4 left-0 w-1/4 z-10 cursor-w-resize" onClick={handlePrev} />
                            <div className="absolute top-1/4 bottom-1/4 right-0 w-1/4 z-10 cursor-e-resize" onClick={handleNext} />
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
