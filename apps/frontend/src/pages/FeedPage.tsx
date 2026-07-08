import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, Zap, Loader2, Trash2, Camera, CheckCircle2 } from 'lucide-react';
import { feed, upload } from '../services/api';
import { secureStorage } from '../utils/secureStorage';

export type FeedPost = {
    id: string;
    content: string | null;
    mediaUrl?: string | null;
    type: 'post' | 'reel' | 'story';
    likesCount: number;
    createdAt: string;
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
            className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-6 hover:border-white/10 transition-all relative"
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
                        <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0f] border border-white/10 rounded-2xl p-2 shadow-2xl z-20">
                            {post.author?.id === currentUserId ? (
                                <button
                                    onClick={handleDeletePost}
                                    disabled={deleting}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider text-red-400 hover:bg-white/5 rounded-xl transition-all"
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
                <p className="text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                    {post.content}
                </p>
            )}

            {post.mediaUrl && (
                <div className="rounded-2xl overflow-hidden mb-4 border border-white/5 aspect-video bg-slate-900 flex items-center justify-center">
                    <img src={post.mediaUrl} alt="Post content" className="w-full h-full object-cover" />
                </div>
            )}

            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
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
                <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
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

    // Media attachment state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachedMediaUrl, setAttachedMediaUrl] = useState<string | null>(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    const currentUserId = userProfile?.id || null;

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

            const res = await feed.create(authorId, composerText.trim(), 'post', attachedMediaUrl || undefined);
            setComposerText('');
            setAttachedMediaUrl(null);
            
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
            {/* Create Post Area */}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-8">
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
                            <div className="mt-3 relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-white/10 group max-h-48">
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
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
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
                        <button className="text-slate-500 hover:text-white transition-colors text-xs font-mono uppercase tracking-tighter">Poll</button>
                    </div>
                    <button
                        onClick={handleCreatePost}
                        disabled={!canPost || creating || uploadingMedia}
                        className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-blue-400 transition-all disabled:opacity-60 disabled:hover:bg-white flex items-center gap-2"
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
                        className="px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] bg-white/5 border border-white/10 rounded-full hover:bg-white/10"
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
        </div>
    );
};
