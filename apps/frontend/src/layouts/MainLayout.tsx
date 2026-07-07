import React from 'react';
import { motion } from 'framer-motion';
import { Home, MessageSquare, Tv, User, Bell, Settings, Zap, DollarSign } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
    <motion.div
        whileHover={{ x: 5 }}
        className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors ${active ? 'text-cyan-400 border-r-2 border-cyan-400 bg-cyan-400/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
    >
        <Icon size={22} className={active ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''} />
        <span className="font-medium tracking-wide">{label}</span>
    </motion.div>
);

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex h-screen bg-[#0a0b1e] text-slate-200 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800/50 flex flex-col bg-[#0d0e26]">
                <div className="p-8">
                    <h1 className="text-2xl font-black italic tracking-tighter">
                        findpals<span className="text-cyan-400">social</span>
                    </h1>
                </div>

                <nav className="flex-1 mt-4">
                    <SidebarItem icon={Home} label="Feed" active />
                    <SidebarItem icon={Tv} label="Reels" />
                    <SidebarItem icon={MessageSquare} label="Messages" />
                    <SidebarItem icon={Zap} label="Live Rooms" />
                    <SidebarItem icon={DollarSign} label="Creator Hub" />
                    <SidebarItem icon={Bell} label="Notifications" />
                    <SidebarItem icon={User} label="Profile" />
                </nav>

                <div className="p-6 border-t border-slate-800/50">
                    <SidebarItem icon={Settings} label="Settings" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto custom-scrollbar">
                {/* Top Header */}
                <header className="sticky top-0 z-20 backdrop-blur-md bg-[#0a0b1e]/80 border-b border-slate-800/50 px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">System Secure // Node 8023</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-sm font-bold hover:bg-cyan-500/20 transition-all">
                            1,240 XP
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-pink-500 p-[2px]">
                            <div className="w-full h-full rounded-full bg-[#0a0b1e] flex items-center justify-center overflow-hidden">
                                <User size={20} />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-1?8 max-w-4xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Right Sidebar - Trending/Suggested */}
            <aside className="w-80 border-l border-slate-800/50 hidden xl:flex flex-col bg-[#0d0e26]/50 p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Trending socials</h2>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer">
                            <div className="text-xs text-cyan-400 font-mono mb-1">#cyber-security</div>
                            <div className="font-bold">The future of AES-256 in social nets</div>
                            <div className="text-xs text-slate-500 mt-2">4.2k active nodes</div>
                        </div>
                    ))}
                </div>
            </aside>
        </div>
    );
};
