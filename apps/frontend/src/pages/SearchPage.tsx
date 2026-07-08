import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, User as UserIcon, Zap } from 'lucide-react';
import { users } from '../services/api';

type SearchResult = {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    isCreator?: boolean;
    level?: number;
};

export const SearchPage = ({ setCurrentPage, setViewUserId }: { setCurrentPage: (page: string) => void, setViewUserId: (id: string) => void }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (q: string) => {
        setQuery(q);
        if (q.trim().length < 2) {
            setResults([]);
            setSearched(false);
            return;
        }
        setLoading(true);
        setSearched(true);
        try {
            const res = await users.search(q.trim(), 20);
            setResults(res.data);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewProfile = (userId: string) => {
        setViewUserId(userId);
        setCurrentPage('view-profile');
    };

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8 pb-24">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Search className="text-blue-500" /> Discover
            </h1>

            <div className="relative mb-8">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search people by username or name..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
                />
            </div>

            {loading && (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-blue-500" size={24} />
                </div>
            )}

            {!loading && results.length > 0 && (
                <div className="space-y-3">
                    {results.map(user => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleViewProfile(user.id)}
                            className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-white/10 transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 border border-white/10">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                                        {(user.displayName || user.username)?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-white flex items-center gap-2">
                                    {user.displayName || user.username}
                                    {user.isCreator && (
                                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white">
                                            ✓
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500 font-mono">@{user.username}</div>
                            </div>
                            <div className="text-xs text-slate-600 font-mono">LVL {user.level || 1}</div>
                        </motion.div>
                    ))}
                </div>
            )}

            {!loading && searched && results.length === 0 && query.length >= 2 && (
                <div className="text-center py-20 text-slate-500 border border-dashed border-white/10 rounded-3xl">
                    <UserIcon size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-mono text-sm uppercase tracking-widest">No users found</p>
                    <p className="text-xs mt-2 opacity-60">Try a different search term.</p>
                </div>
            )}

            {!searched && (
                <div className="text-center py-20 text-slate-600">
                    <Search size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-mono text-xs uppercase tracking-widest">Find your people</p>
                    <p className="text-xs mt-2 opacity-60">Type at least 2 characters to search.</p>
                </div>
            )}
        </div>
    );
};
