import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Home, Search, Plus, MessageSquare, User, Bell, Tv, Settings } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all ${
            active ? 'bg-blue-600 text-white font-bold shadow-[0_0_15px_rgba(0,85,255,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
        }`}
    >
        <Icon size={22} className={active ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''} />
        <span className="tracking-wide text-sm">{label}</span>
    </div>
);

const BottomNavItem = ({ icon: Icon, active, onClick, badge }: { icon: any, active: boolean, onClick: () => void, badge?: number }) => (
    <div className="relative flex flex-col items-center justify-center w-16 h-full cursor-pointer" onClick={onClick}>
        <Icon size={24} className={`transition-colors ${active ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(0,85,255,0.8)]' : 'text-slate-500'}`} strokeWidth={active ? 2.5 : 2} />
        {badge && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full text-[9px] font-bold flex items-center justify-center text-white border border-black shadow-[0_0_5px_rgba(0,85,255,0.5)]">
                {badge}
            </span>
        )}
        {active && (
            <motion.div layoutId="bottom-nav-indicator" className="absolute -bottom-1 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(0,85,255,1)]" />
        )}
    </div>
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
        <div className="flex flex-col md:flex-row h-screen bg-black text-white overflow-hidden font-sans">
            
            {/* Mobile Top Header (only visible on small screens) */}
            <header className="md:hidden flex justify-between items-center px-4 py-3 border-b border-white/10 bg-black z-20">
                <h1 className="text-xl font-black italic tracking-tighter cursor-pointer" onClick={() => setCurrentPage('feed')}>
                    findpals<span className="text-blue-500">social</span>
                </h1>
                <div className="flex items-center gap-3">
                    <button className="text-slate-300 hover:text-white transition-colors" onClick={() => setCurrentPage('notifications')}>
                        <Bell size={22} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setCurrentPage('settings')}>
                        {userProfile?.avatarUrl ? (
                            <img src={userProfile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={16} />
                        )}
                    </div>
                </div>
            </header>

            {/* Desktop Left Sidebar (hidden on mobile) */}
            <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-[#0a0a0a]">
                <div className="p-8">
                    <h1 className="text-2xl font-black italic tracking-tighter cursor-pointer" onClick={() => setCurrentPage('feed')}>
                        findpals<span className="text-blue-500">social</span>
                    </h1>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <SidebarItem icon={Home} label="Home" active={currentPage === 'feed'} onClick={() => setCurrentPage('feed')} />
                    <SidebarItem icon={Search} label="Search" active={currentPage === 'search'} onClick={() => setCurrentPage('feed')} />
                    <SidebarItem icon={Tv} label="Reels" active={currentPage === 'live'} onClick={() => setCurrentPage('live')} />
                    <SidebarItem icon={MessageSquare} label="Inbox" active={currentPage === 'messages'} onClick={() => setCurrentPage('messages')} />
                    <SidebarItem icon={Bell} label="Notifications" active={currentPage === 'notifications'} onClick={() => setCurrentPage('feed')} />
                    <SidebarItem icon={User} label="Profile" active={currentPage === 'profile'} onClick={() => setCurrentPage('profile')} />
                </nav>
                <div className="p-4 border-t border-white/10">
                    <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_15px_rgba(0,85,255,0.4)]">
                        Create Post
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-y-auto custom-scrollbar pb-20 md:pb-0 bg-black">
                {/* Optional Desktop Top Header */}
                <header className="hidden md:flex sticky top-0 z-20 backdrop-blur-md bg-black/80 border-b border-white/10 px-8 py-4 justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(0,85,255,0.8)]" />
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">FindPals Secure</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-bold hover:bg-blue-500/20 transition-all">
                            {userProfile ? `${userProfile.xp.toLocaleString()} XP` : '0 XP'}
                        </button>
                    </div>
                </header>

                <div className="w-full h-full">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 pb-safe z-50">
                <div className="flex justify-around items-center h-16 px-2">
                    <BottomNavItem icon={Home} active={currentPage === 'feed'} onClick={() => setCurrentPage('feed')} />
                    <BottomNavItem icon={Search} active={currentPage === 'search'} onClick={() => setCurrentPage('feed')} />
                    
                    {/* Glowing Center Create Button */}
                    <div className="relative -top-5">
                        <button 
                            className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,85,255,0.6)] border-[4px] border-black transition-transform active:scale-95"
                            onClick={() => setCurrentPage('live')}
                        >
                            <Plus size={28} />
                        </button>
                    </div>
                    
                    <BottomNavItem icon={MessageSquare} active={currentPage === 'messages'} onClick={() => setCurrentPage('messages')} />
                    <BottomNavItem icon={User} active={currentPage === 'profile'} onClick={() => setCurrentPage('profile')} />
                </div>
            </nav>
        </div>
    );
};
