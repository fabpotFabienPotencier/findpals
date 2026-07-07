import React, { useState, useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { FeedPage } from './pages/FeedPage';
import { MessagingPage } from './pages/MessagingPage';
import { CreatorHub } from './pages/CreatorHub';
import { OnboardingPage } from './pages/OnboardingPage';
import { WalletPage } from './pages/WalletPage';
import { LiveStreamPage } from './pages/LiveStreamPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
    const [currentPage, setCurrentPage] = useState<'landing' | 'onboarding' | 'feed' | 'messages' | 'creator' | 'wallet' | 'live' | 'settings'>('onboarding');
    const [mode, setMode] = useState<'communication-only' | 'general' | ''>('');
    const [hostname, setHostname] = useState(window.location.hostname);

    useEffect(() => {
        // Handle local development where hostname is localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // Default to social app behavior for local dev, or provide a toggle
            // For now, we'll let it drop through to the standard app flow
        }
        
        // Check for existing encrypted auth token
        const checkAuth = async () => {
            const stored = localStorage.getItem('auth_token');
            if (stored) {
                // In a full implementation you'd verify via /auth/me; for now just trust presence
                if (hostname === 'account.findpals.xyz') {
                    // Redirect to social if already logged in
                    window.location.href = 'https://social.findpals.xyz';
                } else {
                    setCurrentPage('feed');
                }
            } else {
                if (hostname === 'social.findpals.xyz') {
                    // Redirect to login if not authenticated
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
                <OnboardingPage onComplete={(m) => {
                    setMode(m);
                    // Successfully logged in, redirect to social feed
                    localStorage.setItem('auth_token', 'temp_mock_token');
                    window.location.href = 'https://social.findpals.xyz';
                }} />
            </div>
        );
    }

    // Subdomain: findpals.xyz -> Landing Page (Marketing)
    // Assuming 'findpals.xyz' or 'www.findpals.xyz'
    if (hostname === 'findpals.xyz' || hostname === 'www.findpals.xyz') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white">
                <h1 className="text-5xl font-bold text-[#00ff9d] mb-6 drop-shadow-[0_0_15px_rgba(0,255,157,0.5)]">FIND PALS</h1>
                <p className="text-xl text-slate-400 mb-8 max-w-lg text-center">
                    The next-generation encrypted social platform with a premium cyber-neon aesthetic.
                </p>
                <div className="flex gap-4">
                    <button 
                        onClick={() => window.location.href = 'https://account.findpals.xyz'}
                        className="px-8 py-3 bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/30 rounded-lg font-bold hover:bg-[#00ff9d]/20 transition-all">
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
            case 'feed': return <FeedPage />;
            case 'messages': return <MessagingPage />;
            case 'creator': return <CreatorHub />;
            case 'wallet': return <WalletPage />;
            case 'live': return <LiveStreamPage />;
            case 'settings': return <SettingsPage />;
            default: return <FeedPage />;
        }
    };

    return (
        <MainLayout>
            {/* Navigation toggle for demo purposes */}
            <div className="absolute top-20 right-8 z-50 flex gap-2">
                <button onClick={() => setCurrentPage('feed')} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] hover:bg-white/10 transition-all uppercase font-bold text-slate-400">Feed</button>
                <button onClick={() => setCurrentPage('messages')} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] hover:bg-white/10 transition-all uppercase font-bold text-slate-400">Chat</button>
                <button onClick={() => setCurrentPage('creator')} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] hover:bg-white/10 transition-all uppercase font-bold text-slate-400">Creator</button>
                <button onClick={() => setCurrentPage('wallet')} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] hover:bg-white/10 transition-all uppercase font-bold text-slate-400">Wallet</button>
                <button onClick={() => setCurrentPage('live')} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] hover:bg-white/10 transition-all uppercase font-bold text-slate-400">Live</button>
                <button onClick={() => setCurrentPage('settings')} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] hover:bg-white/10 transition-all uppercase font-bold text-slate-400">Settings</button>
            </div>
            {renderPage()}
        </MainLayout>
    )
}

export default App
