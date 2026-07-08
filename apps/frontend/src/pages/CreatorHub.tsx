import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, Zap, Plus, ArrowUpRight } from 'lucide-react';

export const CreatorHub = ({ userProfile, setCurrentPage }: { userProfile: any; setCurrentPage?: (page: string) => void }) => {
    const balance = userProfile ? Number(userProfile.walletBalance) : 0;
    const level = userProfile?.level || 1;
    const xp = userProfile?.xp || 0;
    
    // Level math
    const currentLevelMinXp = Math.pow(level - 1, 2) * 100;
    const nextLevelMinXp = Math.pow(level, 2) * 100;
    const xpDifference = nextLevelMinXp - currentLevelMinXp;
    const xpInCurrentLevel = xp - currentLevelMinXp;
    const progressPercent = xpDifference > 0 ? Math.min(100, Math.max(0, (xpInCurrentLevel / xpDifference) * 100)) : 0;
    const xpRemaining = nextLevelMinXp - xp;

    const getLevelTitle = (lvl: number) => {
        if (lvl < 3) return 'social ROOKIE';
        if (lvl < 6) return 'social RUNNER';
        if (lvl < 10) return 'social WARRIOR';
        return 'social CHIEF';
    };

    return (
        <div className="mt-8 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Balance Card */}
                <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-cyan-500/20 to-pink-500/20 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col justify-between min-h-[240px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-cyan-400/10 transition-colors">
                        <DollarSign size={120} />
                    </div>
                    <div>
                        <div className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-2">Total Balance</div>
                        <div className="text-5xl font-black italic">${balance.toFixed(2)}</div>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button 
                            onClick={() => setCurrentPage?.('wallet')}
                            className="px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-cyan-400 transition-all flex items-center gap-2"
                        >
                            Withdraw <ArrowUpRight size={18} />
                        </button>
                        <button 
                            onClick={() => setCurrentPage?.('wallet')}
                            className="px-6 py-3 bg-white/10 border border-white/5 text-white font-bold rounded-2xl hover:bg-white/20 transition-all"
                        >
                            Transactions
                        </button>
                    </div>
                </div>

                {/* Level Card */}
                <div className="bg-[#0d0e26] border border-cyan-500/30 rounded-3xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                    <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4">Current Level</div>
                    <div className="w-24 h-24 rounded-full border-4 border-cyan-500/20 flex items-center justify-center mb-4 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin-slow" />
                        <span className="text-4xl font-black italic text-cyan-400">{level}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-300 uppercase">{getLevelTitle(level)}</div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-cyan-500 h-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 font-mono italic">{xpRemaining} XP to Level {level + 1}</div>
                </div>
            </div>

            <h2 className="text-xl font-bold mb-6 text-white italic">Creator Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Followers', value: (userProfile?.followersCount || 0).toLocaleString(), icon: Users, trend: 'Active', color: 'text-blue-400' },
                    { label: 'Following', value: (userProfile?.followingCount || 0).toLocaleString(), icon: Users, trend: 'Active', color: 'text-green-400' },
                    { label: 'Level Rank', value: `LVL ${level}`, icon: Zap, trend: 'Record!', color: 'text-orange-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-xl bg-white/5 ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">
                                {stat.trend}
                            </span>
                        </div>
                        <div className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Subscription Plans */}
            <div className="mt-12 bg-[#0d0e26] border border-white/5 rounded-3xl p-8">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-bold italic">Subscription Plans</h3>
                    <button className="flex items-center gap-2 text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
                        <Plus size={18} /> New Plan
                    </button>
                </div>
                <div className="space-y-4">
                    {[
                        { name: 'social Access', price: '$4.99/mo', benefits: 'Locked content, badge' },
                        { name: 'Dimension Plus', price: '$9.99/mo', benefits: 'Private stream access, DMs' },
                    ].map((plan, i) => (
                        <div key={i} className="flex justify-between items-center p-6 border border-white/5 rounded-2xl hover:bg-white/5 transition-all">
                            <div>
                                <div className="font-bold text-white">{plan.name}</div>
                                <div className="text-xs text-slate-500 font-mono italic">{plan.benefits}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-cyan-400">{plan.price}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Active</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
