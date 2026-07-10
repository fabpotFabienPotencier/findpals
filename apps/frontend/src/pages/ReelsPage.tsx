import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreVertical, Music, Zap, Loader2, Send, X, Video, Plus } from 'lucide-react';
import { feed, users, upload } from '../services/api';
import { secureStorage } from '../utils/secureStorage';
import { type FeedPost } from './FeedPage';

const ReelPlayer = ({ 
    reel, 
    isActive, 
    userProfile, 
    setCurrentPage, 
    setViewUserId 
}: { 
    reel: FeedPost; 
    isActive: boolean; 
    userProfile: any; 
    setCurrentPage: (page: string) => void; 
    setViewUserId: (id: string) => void; 
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(reel.likesCount || 0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [checkingFollow, setCheckingFollow] = useState(false);
    const [copied, setCopied] = useState(false);

    // Comments overlay state
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [sendingComment, setSendingComment] = useState(false);

    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
            setIsPlaying(true);
        } else if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    }, [isActive]);

    // Fetch initial status (like status and follow status)
    useEffect(() => {
        const fetchStatus = async () => {
            if (!userProfile) return;
            try {
                // Like status
                const likeRes = await feed.isLiked(reel.id);
                setIsLiked(likeRes.data.isLiked);

                // Follow status (if not self)
                if (reel.author?.id && reel.author.id !== userProfile.id) {
                    const followRes = await users.isFollowing(reel.author.id);
                    setIsFollowing(followRes.data.isFollowing);
                }
            } catch (err) {
                console.error('Error fetching reel status:', err);
            }
        };
        fetchStatus();
    }, [reel.id, reel.author?.id, userProfile]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play().catch(e => console.log('Play prevented:', e));
        }
        setIsPlaying(!isPlaying);
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!userProfile) return;
        
        // Optimistic UI update
        const originalLiked = isLiked;
        const originalCount = likesCount;
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            if (originalLiked) {
                await feed.unlikePost(reel.id);
            } else {
                await feed.likePost(reel.id);
            }
        } catch (err) {
            // Rollback on error
            setIsLiked(originalLiked);
            setLikesCount(originalCount);
            console.error('Like action failed:', err);
        }
    };

    const handleFollow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!userProfile || !reel.author?.id || checkingFollow) return;
        setCheckingFollow(true);
        try {
            if (isFollowing) {
                await users.unfollow(reel.author.id);
                setIsFollowing(false);
            } else {
                await users.follow(reel.author.id);
                setIsFollowing(true);
            }
        } catch (err) {
            console.error('Follow action failed:', err);
        } finally {
            setCheckingFollow(false);
        }
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/reel/${reel.id}`;
        if (navigator.share) {
            navigator.share({
                title: 'FindPals Reel',
                text: reel.content || 'Check out this awesome Reel on FindPals!',
                url: url
            }).catch(err => console.error(err));
        } else {
            navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const handleViewAuthorProfile = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!reel.author?.id) return;
        setViewUserId(reel.author.id);
        setCurrentPage('view-profile');
    };

    const handleOpenComments = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowComments(true);
        setLoadingComments(true);
        try {
            const res = await feed.getComments(reel.id);
            setComments(res.data);
        } catch (err) {
            console.error('Failed to load comments:', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentInput.trim() || sendingComment || !userProfile) return;
        setSendingComment(true);
        try {
            const res = await feed.comment(reel.id, userProfile.id, commentInput.trim());
            setComments(prev => [...prev, res.data]);
            setCommentInput('');
        } catch (err) {
            console.error('Failed to add comment:', err);
        } finally {
            setSendingComment(false);
        }
    };

    return (
        <div className="relative w-full h-full bg-black snap-start flex-shrink-0 flex justify-center overflow-hidden">
            {/* Video Element */}
            {reel.mediaUrl ? (
                <video
                    ref={videoRef}
                    src={reel.mediaUrl}
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                    onClick={togglePlay}
                />
            ) : (
                <div 
                    className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-black"
                    onClick={togglePlay}
                >
                    <div className="text-white/50 font-mono text-sm uppercase tracking-widest text-center px-8">
                        {reel.content || 'Video content unavailable'}
                    </div>
                </div>
            )}

            {/* Play/Pause Overlay */}
            <AnimatePresence>
                {!isPlaying && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <div className="w-16 h-16 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                            <div className="ml-1 w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-10">
                {/* Like Button */}
                <button 
                    onClick={handleLike}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className={`w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center transition-all ${isLiked ? 'text-pink-500' : 'text-white'}`}>
                        <Heart size={24} className={isLiked ? 'fill-pink-500' : ''} />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-md">{likesCount}</span>
                </button>

                {/* Comments Button */}
                <button onClick={handleOpenComments} className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:text-blue-400 transition-colors">
                        <MessageCircle size={24} />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-md">{comments.length || 0}</span>
                </button>

                {/* Share Button */}
                <button onClick={handleShare} className="flex flex-col items-center gap-1 group relative">
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:text-blue-400 transition-colors">
                        <Share2 size={24} />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-md">
                        {copied ? 'Copied!' : 'Share'}
                    </span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
                        <MoreVertical size={24} />
                    </div>
                </button>
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-0 left-0 right-16 p-4 pt-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div 
                        onClick={handleViewAuthorProfile}
                        className="w-10 h-10 rounded-full border-2 border-blue-500 bg-slate-800 overflow-hidden cursor-pointer"
                    >
                        {reel.author?.avatarUrl ? (
                            <img src={reel.author.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold bg-blue-600">
                                {reel.author?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                    <div 
                        onClick={handleViewAuthorProfile}
                        className="text-white font-bold text-sm drop-shadow-md flex items-center gap-1 cursor-pointer hover:underline"
                    >
                        @{reel.author?.username || 'anonymous'}
                        {reel.author?.isCreator && (
                            <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white">✓</div>
                        )}
                    </div>

                    {/* Follow button shown only if not yourself */}
                    {userProfile && reel.author?.id && reel.author.id !== userProfile.id && (
                        <button 
                            onClick={handleFollow}
                            disabled={checkingFollow}
                            className={`ml-2 px-3 py-1 backdrop-blur rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
                                isFollowing 
                                    ? 'bg-white/10 text-white border-white/20' 
                                    : 'bg-blue-600/20 text-blue-400 border-blue-500/50 hover:bg-blue-600/35'
                            }`}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    )}
                </div>
                
                {reel.content && (
                    <p className="text-white text-sm mb-3 drop-shadow-md line-clamp-2">
                        {reel.content}
                    </p>
                )}

                <div className="flex items-center gap-2 text-white/80 text-xs drop-shadow-md">
                    <Music size={12} className="animate-pulse" />
                    <span className="marquee-text whitespace-nowrap overflow-hidden text-ellipsis">Original Audio - FindPals Creator</span>
                </div>
            </div>

            {/* Comments Overlay Drawer */}
            <AnimatePresence>
                {showComments && (
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute inset-x-0 bottom-0 theme-bg-surface border-t theme-border rounded-t-3xl h-[60%] flex flex-col z-20 pb-safe shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b theme-border flex justify-between items-center">
                            <span className="text-sm font-bold theme-text-primary font-mono uppercase tracking-wider">Comments</span>
                            <button 
                                onClick={() => setShowComments(false)}
                                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 theme-text-muted hover:theme-text-primary transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {loadingComments ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="animate-spin theme-text-accent" size={24} />
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-10 theme-text-muted font-mono text-xs">
                                    No comments yet. Start the conversation!
                                </div>
                            ) : (
                                comments.map(comment => {
                                    const cName = comment.author?.displayName || comment.author?.username || 'Anonymous';
                                    return (
                                        <div key={comment.id} className="flex gap-3 text-sm items-start">
                                            <div className="w-8 h-8 rounded-full overflow-hidden theme-bg-secondary border theme-border flex-shrink-0">
                                                {comment.author?.avatarUrl ? (
                                                    <img src={comment.author.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-blue-600">
                                                        {cName[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 theme-bg-secondary border theme-border rounded-2xl px-4 py-2">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold theme-text-primary text-xs">{cName}</span>
                                                    <span className="text-[9px] theme-text-muted font-mono">
                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="theme-text-secondary text-xs">{comment.content}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={handleSendComment} className="p-4 border-t theme-border theme-bg-secondary flex gap-2">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                className="flex-1 theme-input rounded-xl px-4 py-2 text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!commentInput.trim() || sendingComment}
                                className="theme-button-accent p-2.5 rounded-xl transition-colors disabled:opacity-50"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const ReelsPage = ({ 
    userProfile, 
    setCurrentPage, 
    setViewUserId 
}: { 
    userProfile?: any; 
    setCurrentPage?: (page: string) => void; 
    setViewUserId?: (id: string) => void; 
}) => {
    const [reels, setReels] = useState<FeedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Reel upload states
    const [uploadOpen, setUploadOpen] = useState(false);
    const [reelFile, setReelFile] = useState<File | null>(null);
    const [reelPreview, setReelPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [price, setPrice] = useState('2.99');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadReels = async () => {
            try {
                setLoading(true);
                const res = await feed.getReels(1, 10);
                setReels(res.data);
            } catch (e: any) {
                setError(e.response?.data?.message || 'Failed to load reels');
            } finally {
                setLoading(false);
            }
        };
        loadReels();
    }, []);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const scrollPosition = scrollContainerRef.current.scrollTop;
        const windowHeight = scrollContainerRef.current.clientHeight;
        const index = Math.round(scrollPosition / windowHeight);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const handleCreateReel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reelFile || uploading) return;
        setUploading(true);
        setError(null);

        try {
            const videoUrl = await upload.uploadFile(reelFile, 'reels');

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
                caption.trim(),
                'reel',
                videoUrl,
                isPremium,
                isPremium ? Number(price) : 0
            );

            const newReel: FeedPost = {
                ...res.data,
                author: {
                    id: authorId,
                    username: userProfile?.username || 'anonymous',
                    displayName: userProfile?.displayName,
                    avatarUrl: userProfile?.avatarUrl,
                    isCreator: userProfile?.isCreator,
                }
            };
            setReels(prev => [newReel, ...prev]);

            setUploadOpen(false);
            setReelFile(null);
            setReelPreview(null);
            setCaption('');
            setIsPremium(false);
            setPrice('2.99');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to create reel');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full pt-20">
                <Loader2 className="animate-spin theme-text-accent" size={32} />
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-black">
            {/* Create Reel Button */}
            <div className="absolute top-4 right-4 z-30">
                <button
                    onClick={() => setUploadOpen(true)}
                    className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5"
                >
                    <Plus size={20} />
                    <span className="text-xs font-mono uppercase tracking-wider font-bold">Create</span>
                </button>
            </div>

            {reels.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <Zap size={48} className="theme-text-muted mb-4 opacity-50" />
                    <p className="theme-text-secondary font-mono text-sm uppercase tracking-widest">No Reels Found</p>
                    <p className="theme-text-muted text-xs mt-2">Be the first to create one!</p>
                </div>
            ) : (
                <div 
                    ref={scrollContainerRef}
                    className="w-full h-full overflow-y-scroll snap-y snap-mandatory bg-black hide-scrollbar"
                    onScroll={handleScroll}
                    style={{ height: 'calc(100vh - 64px)' }} // Subtract bottom nav height on mobile
                >
                    {reels.map((reel, index) => (
                        <div key={reel.id} className="w-full h-full snap-start relative">
                            <ReelPlayer 
                                reel={reel} 
                                isActive={index === activeIndex} 
                                userProfile={userProfile}
                                setCurrentPage={setCurrentPage || (() => {})}
                                setViewUserId={setViewUserId || (() => {})}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Reel Modal */}
            <AnimatePresence>
                {uploadOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !uploading && setUploadOpen(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-md theme-card border theme-border rounded-3xl p-6 relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold theme-text-primary flex items-center gap-2">
                                    <Video className="text-pink-500" size={20} />
                                    <span>Create Reel</span>
                                </h3>
                                <button 
                                    onClick={() => !uploading && setUploadOpen(false)}
                                    className="p-1 rounded-full hover:theme-bg-secondary theme-text-muted hover:theme-text-primary transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateReel} className="space-y-6">
                                {/* Video Upload Slot */}
                                <div 
                                    onClick={() => !uploading && fileInputRef.current?.click()}
                                    className="border-2 border-dashed theme-border rounded-2xl p-8 text-center cursor-pointer hover:border-pink-500/50 transition-colors relative aspect-video flex flex-col items-center justify-center overflow-hidden theme-bg-secondary"
                                >
                                    {reelPreview ? (
                                        <video 
                                            src={reelPreview} 
                                            className="absolute inset-0 w-full h-full object-cover" 
                                            muted 
                                            loop 
                                            autoPlay 
                                        />
                                    ) : (
                                        <>
                                            <Video className="text-slate-500 mb-3" size={36} />
                                            <span className="text-xs font-mono uppercase tracking-wider theme-text-muted">Select Video File</span>
                                            <span className="text-[10px] theme-text-muted mt-1 font-mono">MP4, WebM (max 50MB)</span>
                                        </>
                                    )}
                                    <input 
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="video/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setReelFile(file);
                                                setReelPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </div>

                                {/* Caption */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-mono uppercase tracking-wider theme-text-muted">Caption</label>
                                    <textarea
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="Describe your Reel..."
                                        rows={3}
                                        className="w-full theme-input rounded-xl px-4 py-2.5 text-sm resize-none"
                                        required
                                    />
                                </div>

                                {/* Premium Settings */}
                                {userProfile?.isCreator && (
                                    <div className="border theme-border rounded-2xl p-4 space-y-4">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold theme-text-primary">Premium Locked Content</span>
                                                <span className="text-[10px] theme-text-muted">Users must pay to view this Reel</span>
                                            </div>
                                            <input 
                                                type="checkbox"
                                                checked={isPremium}
                                                onChange={(e) => setIsPremium(e.target.checked)}
                                                className="rounded border-white/10 bg-transparent text-pink-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                                            />
                                        </label>

                                        {isPremium && (
                                            <div className="flex gap-3 items-center">
                                                <span className="text-xs font-mono theme-text-muted">Unlock Price:</span>
                                                <div className="flex-1 flex gap-2">
                                                    <span className="theme-bg-surface border theme-border rounded-xl px-3 py-1.5 text-sm theme-text-muted font-mono flex items-center">$</span>
                                                    <input 
                                                        type="number"
                                                        value={price}
                                                        onChange={(e) => setPrice(e.target.value)}
                                                        className="w-full theme-input rounded-xl px-3 py-1.5 text-sm font-mono"
                                                        placeholder="2.99"
                                                        step="0.01"
                                                        min="0.10"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Error Alert */}
                                {error && (
                                    <p className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                                        {error}
                                    </p>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-4 justify-end">
                                    <button
                                        type="button"
                                        disabled={uploading}
                                        onClick={() => setUploadOpen(false)}
                                        className="px-5 py-2.5 theme-button-secondary rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading || !reelFile}
                                        className="px-5 py-2.5 theme-button-accent rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                <span>Publishing...</span>
                                            </>
                                        ) : (
                                            <span>Publish Reel</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
