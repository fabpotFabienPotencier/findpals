import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, Zap, Loader2 } from 'lucide-react';
import { feed } from '../services/api';
import { secureStorage } from '../utils/secureStorage';

type FeedPost = {
    id: string;
    content: string | null;
    mediaUrl?: string | null;
    type: 'post' | 'reel' | 'story';
    likesCount: number;
    createdAt: string;
    author?: {
        username: string;
    };
};

const PostCard = ({ post }: { post: FeedPost }) => {
    const authorName = post.author?.username || 'Unknown';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-6 hover:border-white/10 transition-all"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500" />
                    <div>
                        <div className="font-bold text-white flex items-center gap-2">
                            {authorName}
                            <span className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center text-[10px] text-black">
                                <Zap size={10} fill="currentColor" />
                            </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono italic">@anonymous-node</div>
                    </div>
                </div>
                <button className="text-slate-500 hover:text-white transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {post.content && (
                <p className="text-slate-300 leading-relaxed mb-4">
                    {post.content}
                </p>
            )}

            {post.mediaUrl && (
                <div className="rounded-2xl overflow-hidden mb-4 border border-white/5 aspect-video bg-slate-900 flex items-center justify-center">
                    <img src={post.mediaUrl} alt="Post content" className="w-full h-full object-cover" />
                </div>
            )}

            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                <button className="flex items-center gap-2 text-slate-400 hover:text-pink-500 transition-colors group">
                    <Heart size={20} className="group-hover:fill-pink-500" />
                    <span className="text-sm">{post.likesCount}</span>
                </button>
                <button className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors">
                    <MessageCircle size={20} />
                    <span className="text-sm">0</span>
                </button>
                <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <Share2 size={20} />
                </button>
            </div>
        </motion.div>
    );
};

export const FeedPage = () => {
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [composerText, setComposerText] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const canPost = useMemo(() => composerText.trim().length > 0, [composerText]);

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
        social load();
    }, [page]);

    const handleCreatePost = async () => {
        if (!canPost || creating) return;
        setCreating(true);
        setError(null);
        try {
            const token = await secureStorage.getItem('auth_token');
            let authorId: string | null = null;
            if (token) {
                // Decode JWT payload client-side to extract sub (user id)
                const [, payloadBase64] = token.split('.');
                const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
                const payload = JSON.parse(payloadJson);
                authorId = payload.sub;
            }

            if (!authorId) {
                throw new Error('Unable to resolve user identity from token.');
            }

            const res = await feed.create(authorId, composerText.trim(), 'post');
            setComposerText('');
            setPosts(prev => [res.data as FeedPost, ...prev]);
        } catch (e: any) {
            setError(e.response?.data?.message || e.message || 'Failed to create post');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="mt-8">
            {/* Create Post Area */}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-8">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800" />
                    <textarea
                        placeholder="What's happening in the social?"
                        className="flex-1 bg-transparent border-none focus:ring-0 text-lg resize-none placeholder:text-slate-600 pt-2"
                        rows={2}
                        value={composerText}
                        onChange={e => setComposerText(e.target.value)}
                    />
                </div>
                {error && (
                    <div className="mt-2 text-xs text-red-400 font-mono">
                        {error}
                    </div>
                )}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                    <div className="flex gap-4">
                        <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                            <span className="text-xs font-mono uppercase tracking-tighter">Media</span>
                        </button>
                        <button className="text-slate-500 hover:text-white transition-colors text-xs font-mono uppercase tracking-tighter">Poll</button>
                    </div>
                    <button
                        onClick={handleCreatePost}
                        disabled={!canPost || creating}
                        className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-cyan-400 transition-all disabled:opacity-60 disabled:hover:bg-white flex items-center gap-2"
                    >
                        {creating && <Loader2 size={16} className="animate-spin" />}
                        <span>Post</span>
                    </button>
                </div>
            </div>

            {/* Posts Feed */}
            {posts.map(post => (
                <PostCard key={post.id} post={post} />
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
