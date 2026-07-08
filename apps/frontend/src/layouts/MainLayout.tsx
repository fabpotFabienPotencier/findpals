import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Home, MessageSquare, Tv, User, Bell, Settings, Zap, DollarSign } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
    <motion.div
        whileHover={{ x: 5 }}
        onClick={onClick}
        className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors ${active ? 'text-cyan-400 border-r-2 border-cyan-400 bg-cyan-400/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
    >
        <Icon size={22} className={active ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''} />
        <span className="font-medium tracking-wide">{label}</span>
    </motion.div>
);

export const MainLayout = ({ 
    children, 
    currentPage, 
    setCurrentPage, 
    userProfile 
}: { 
    children: ReactNode, 
    currentPage: string, 
    setCurrentPage: (page: any) => void, 
    userProfile: any 
}) => {
    return (
        <div className="flex h-screen bg-[#0a0b1e] text-slate-200 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800/50 flex flex-col bg-[#0d0e26]">
                <div className="p-8">
                    <h1 className="text-2xl font-black italic tracking-tighter cursor-pointer" onClick={() => setCurrentPage('feed')}>
                        findpals<span className="text-cyan-400">social</span>
                    </h1>
                </div>

                <nav className="flex-1 mt-4">
                    <SidebarItem icon={Home} label="Feed" active={currentPage === 'feed'} onClick={() => setCurrentPage('feed')} />
                    <SidebarItem icon={Tv} label="Reels" active={currentPage === 'reels'} onClick={() => setCurrentPage('feed')} />
                    <SidebarItem icon={MessageSquare} label="Messages" active={currentPage === 'messages'} onClick={() => setCurrentPage('messages')} />
                    <SidebarItem icon={Zap} label="Live Rooms" active={currentPage === 'live'} onClick={() => setCurrentPage('live')} />
                    <SidebarItem icon={DollarSign} label="Creator Hub" active={currentPage === 'creator'} onClick={() => setCurrentPage('creator')} />
                    <SidebarItem icon={Bell} label="Notifications" active={currentPage === 'notifications'} onClick={() => setCurrentPage('feed')} />
                    <SidebarItem icon={User} label="Profile" active={currentPage === 'settings'} onClick={() => setCurrentPage('settings')} />
                </nav>

                <div className="p-6 border-t border-slate-800/50">
                    <SidebarItem icon={Settings} label="Settings" active={currentPage === 'settings'} onClick={() => setCurrentPage('settings')} />
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
                            {userProfile ? `${userProfile.xp.toLocaleString()} XP` : '0 XP'}
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-pink-500 p-[2px] cursor-pointer" onClick={() => setCurrentPage('settings')}>
                            <div className="w-full h-full rounded-full bg-[#0a0b1e] flex items-center justify-center overflow-hidden">
                                {userProfile?.avatarUrl ? (
                                    <img src={userProfile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-4xl mx-auto">
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
