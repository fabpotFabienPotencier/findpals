import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreVertical, Music, Zap, Loader2 } from 'lucide-react';
import { feed } from '../services/api';
import { type FeedPost } from './FeedPage';

const ReelPlayer = ({ reel, isActive }: { reel: FeedPost, isActive: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(reel.likesCount || 0);

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

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play().catch(e => console.log('Play prevented:', e));
        }
        setIsPlaying(!isPlaying);
    };

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
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
            <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center">
                <button 
                    onClick={handleLike}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className={`w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center transition-all ${isLiked ? 'text-pink-500' : 'text-white'}`}>
                        <Heart size={24} className={isLiked ? 'fill-pink-500' : ''} />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-md">{likesCount}</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
                        <MessageCircle size={24} />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-md">0</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
                        <Share2 size={24} />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-md">Share</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
                        <MoreVertical size={24} />
                    </div>
                </button>
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-0 left-0 right-16 p-4 pt-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full border-2 border-blue-500 bg-slate-800 overflow-hidden">
                        {reel.author?.avatarUrl ? (
                            <img src={reel.author.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold bg-blue-600">
                                {reel.author?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                    <div className="text-white font-bold text-sm drop-shadow-md flex items-center gap-1">
                        @{reel.author?.username || 'anonymous'}
                        {reel.author?.username && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white">✓</div>
                        )}
                    </div>
                    <button className="ml-2 px-3 py-1 bg-blue-600/20 backdrop-blur text-blue-400 border border-blue-500/50 rounded-full text-xs font-bold uppercase tracking-wider">
                        Follow
                    </button>
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
        </div>
    );
};

export const ReelsPage = () => {
    const [reels, setReels] = useState<FeedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadReels = async () => {
            try {
                setLoading(true);
                // We fetch specific reel posts if backend supports it, otherwise fallback to feed
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full pt-20">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-4 text-center">
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm">
                    {error}
                </div>
            </div>
        );
    }

    if (reels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <Zap size={48} className="text-slate-600 mb-4" />
                <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">No Reels Found</p>
                <p className="text-slate-600 text-xs mt-2">Be the first to create one!</p>
            </div>
        );
    }

    return (
        <div 
            ref={scrollContainerRef}
            className="w-full h-full overflow-y-scroll snap-y snap-mandatory bg-black hide-scrollbar"
            onScroll={handleScroll}
            style={{ height: 'calc(100vh - 64px)' }} // Subtract bottom nav height on mobile
        >
            {reels.map((reel, index) => (
                <div key={reel.id} className="w-full h-full snap-start relative">
                    <ReelPlayer reel={reel} isActive={index === activeIndex} />
                </div>
            ))}
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
