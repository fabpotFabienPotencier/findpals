import { useState, useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { FeedPage } from './pages/FeedPage';
import { MessagingPage } from './pages/MessagingPage';
import { CreatorHub } from './pages/CreatorHub';
import { OnboardingPage } from './pages/OnboardingPage';
import { WalletPage } from './pages/WalletPage';
import { LiveStreamPage } from './pages/LiveStreamPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReelsPage } from './pages/ReelsPage';
import { SearchPage } from './pages/SearchPage';
import { secureStorage } from './utils/secureStorage';
import { users } from './services/api';

type PageType = 'landing' | 'onboarding' | 'feed' | 'messages' | 'creator' | 'wallet' | 'live' | 'settings' | 'profile' | 'notifications' | 'reels' | 'search' | 'view-profile';

function App() {
    const [currentPage, setCurrentPage] = useState<PageType>('onboarding');
    const [mode, setMode] = useState<'communication-only' | 'general' | ''>('');
    const [hostname, setHostname] = useState(window.location.hostname);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [viewUserId, setViewUserId] = useState<string | null>(null);
    const [activeChat, setActiveChat] = useState<{ id: string; name: string } | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        const savedTheme = (localStorage.getItem('findpals-theme') as 'light' | 'dark') || 'dark';
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        localStorage.setItem('findpals-theme', nextTheme);
        if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await users.getMyProfile();
            setUserProfile(res.data);
        } catch (err) {
            console.error('Failed to load profile:', err);
        }
    };

    const handleLogout = async () => {
        await secureStorage.removeItem('auth_token');
        setUserProfile(null);
        setCurrentPage('onboarding');
    };

    useEffect(() => {
        // Handle local development where hostname is localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // Default to social app behavior for local dev, or provide a toggle
            // For now, we'll let it drop through to the standard app flow
        }
        
        // Check for existing encrypted auth token
        const checkAuth = async () => {
            // Handle cross-subdomain auth transfer
            const urlParams = new URLSearchParams(window.location.search);
            const authTransferToken = urlParams.get('auth_transfer');
            
            if (authTransferToken) {
                // Save the transferred token into this subdomain's secure vault
                await secureStorage.setItem('auth_token', authTransferToken);
                // Strip the token from the URL for security
                window.history.replaceState({}, document.title, window.location.pathname);
                setCurrentPage('feed');
                await fetchProfile();
                return;
            }

            const token = await secureStorage.getItem('auth_token');
            
            if (token) {
                if (hostname === 'account.findpals.xyz') {
                    // Pass the real token to the social subdomain so it can encrypt it locally
                    window.location.href = `https://social.findpals.xyz?auth_transfer=${encodeURIComponent(token)}`;
                } else {
                    setCurrentPage('feed');
                    await fetchProfile();
                }
            } else {
                if (hostname === 'social.findpals.xyz') {
                    window.location.href = 'https://account.findpals.xyz';
                }
            }
        };
        checkAuth();
    }, [hostname]);

    // Subdomain: account.findpals.xyz -> Identity & Auth
    if (hostname === 'account.findpals.xyz') {
        return (
            <div className="min-h-screen bg-[#050505] text-white">
                <OnboardingPage onComplete={async (m) => {
                    setMode(m as 'communication-only' | 'general');
                    const token = await secureStorage.getItem('auth_token');
                    if (token) {
                        window.location.href = `https://social.findpals.xyz?auth_transfer=${encodeURIComponent(token)}`;
                    }
                }} />
            </div>
        );
    }

    // Subdomain: findpals.xyz -> Landing Page (Marketing)
    if (hostname === 'findpals.xyz' || hostname === 'www.findpals.xyz') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
                <h1 className="text-5xl font-bold text-blue-500 mb-6 drop-shadow-[0_0_15px_rgba(0,85,255,0.5)]">FIND PALS</h1>
                <p className="text-xl text-slate-400 mb-8 max-w-lg text-center">
                    The next-generation encrypted social platform with a premium cyber-neon aesthetic.
                </p>
                <div className="flex gap-4">
                    <button 
                        onClick={() => window.location.href = 'https://account.findpals.xyz'}
                        className="px-8 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg font-bold hover:bg-blue-500/20 transition-all">
                        Login / Sign Up
                    </button>
                </div>
            </div>
        );
    }

    // Default / Local / social.findpals.xyz -> Real-time Social App
    // We render the MainLayout and internal navigation
    const renderPage = () => {
        switch (currentPage) {
            case 'onboarding': return <OnboardingPage onComplete={() => setCurrentPage('feed')} />;
            case 'feed': return <FeedPage userProfile={userProfile} setCurrentPage={setCurrentPage as any} setViewUserId={setViewUserId} />;
            case 'messages': return <MessagingPage activeChat={activeChat} setActiveChat={setActiveChat} userProfile={userProfile} />;
            case 'creator': return <CreatorHub userProfile={userProfile} setCurrentPage={(page: any) => setCurrentPage(page)} />;
            case 'profile': return <ProfilePage userProfile={userProfile} setCurrentPage={(page: any) => setCurrentPage(page)} setActiveChat={setActiveChat} setViewUserId={setViewUserId} />;
            case 'view-profile': return <ProfilePage userProfile={userProfile} viewUserId={viewUserId} setCurrentPage={(page: any) => setCurrentPage(page)} setActiveChat={setActiveChat} setViewUserId={setViewUserId} />;
            case 'wallet': return <WalletPage userProfile={userProfile} onDepositSuccess={fetchProfile} />;
            case 'reels': return <ReelsPage userProfile={userProfile} setCurrentPage={(page: any) => setCurrentPage(page)} setViewUserId={setViewUserId} />;
            case 'live': return <LiveStreamPage />;
            case 'settings': return <SettingsPage userProfile={userProfile} onProfileUpdate={fetchProfile} onLogout={handleLogout} />;
            case 'notifications': return <NotificationsPage />;
            case 'search': return <SearchPage setCurrentPage={(page: any) => setCurrentPage(page)} setViewUserId={(id: string) => setViewUserId(id)} />;
            default: return <FeedPage userProfile={userProfile} setCurrentPage={setCurrentPage as any} setViewUserId={setViewUserId} />;
        }
    };

    return (
        <MainLayout
            currentPage={currentPage}
            setCurrentPage={(page: any) => setCurrentPage(page)}
            userProfile={userProfile}
            theme={theme}
            toggleTheme={toggleTheme}
        >
            {renderPage()}
        </MainLayout>
    );
}

export default App
