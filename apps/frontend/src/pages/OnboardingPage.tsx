import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, MessageCircle, Eye, Lock, ArrowRight, Loader } from 'lucide-react';
import { auth } from '../services/api';
import { secureStorage } from '../utils/secureStorage';

export const OnboardingPage = ({ onComplete }: { onComplete: (mode: string) => void }) => {
    const [step, setStep] = useState<'auth' | 'mode'>('auth');
    const [authType, setAuthType] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        setError('');
        setLoading(true);
        try {
            if (authType === 'login') {
                const res = await auth.login(username, password, twoFactorCode || undefined);
                await secureStorage.setItem('auth_token', res.data.access_token);
                // If login successful, check user mode from response
                onComplete(res.data.user.mode);
            } else {
                // If registering, validate email then move to mode selection
                if (!email || !email.includes('@')) {
                    throw new Error('Please enter a valid email address');
                }
                setStep('mode');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (mode: 'communication-only' | 'general') => {
        setLoading(true);
        try {
            const res = await auth.register(username, password, email, mode, true);
            const loginRes = await auth.login(username, password);
            await secureStorage.setItem('auth_token', loginRes.data.access_token);
            onComplete(mode);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 theme-bg-primary">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black italic mb-2">findpals <span className="theme-text-accent">social</span></h1>
                    <p className="theme-text-muted font-mono text-xs tracking-widest uppercase">
                        {step === 'auth' ? 'Identity Verification' : 'Operational Protocol'}
                    </p>
                </div>

                {step === 'auth' && (
                    <div className="theme-card rounded-3xl p-8 backdrop-blur-xl">
                        <div className="theme-bg-secondary p-1 rounded-xl flex gap-4 mb-8">
                            <button
                                onClick={() => setAuthType('login')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authType === 'login' ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400' : 'theme-text-muted hover:theme-text-primary'}`}
                            >
                                LOGIN
                            </button>
                            <button
                                onClick={() => setAuthType('register')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authType === 'register' ? 'bg-pink-500/20 text-pink-600 dark:text-pink-400' : 'theme-text-muted hover:theme-text-primary'}`}
                            >
                                REGISTER
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs theme-text-muted font-bold ml-2">CODENAME</label>
                                <div className="relative mt-1">
                                    <Shield className="absolute left-4 top-3 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full theme-input rounded-xl py-3 pl-12 pr-4 focus:outline-none"
                                        placeholder="Enter pseudonym..."
                                    />
                                </div>
                            </div>
                            {authType === 'register' && (
                                <div>
                                    <label className="text-xs theme-text-muted font-bold ml-2">RECOVERY EMAIL</label>
                                    <div className="relative mt-1">
                                        <Shield className="absolute left-4 top-3 text-slate-500" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full theme-input rounded-xl py-3 pl-12 pr-4 focus:outline-none"
                                            placeholder="Enter valid email address..."
                                        />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="text-xs theme-text-muted font-bold ml-2">2FA CODE (IF ENABLED)</label>
                                <div className="relative mt-1">
                                    <input
                                        type="text"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value)}
                                        className="w-full theme-input rounded-xl py-3 px-4 focus:outline-none tracking-[0.3em] text-sm"
                                        placeholder="------"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs theme-text-muted font-bold ml-2">ACCESS KEY</label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-4 top-3 text-slate-500" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full theme-input rounded-xl py-3 pl-12 pr-4 focus:outline-none"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && <div className="mt-4 text-red-400 text-xs text-center">{error}</div>}

                        <button
                            onClick={handleAuth}
                            disabled={loading || !username || !password}
                            className="w-full mt-8 theme-button-accent font-bold py-4 rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="animate-spin" size={20} /> : (
                                <>
                                    {authType === 'login' ? 'ESTABLISH LINK' : 'INITIALIZE IDENTITY'} <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                )}

                {step === 'mode' && (
                    <div className="grid grid-cols-1 gap-4">
                        <p className="theme-text-muted text-sm text-center mb-4">Select your interaction protocol. This can be changed later.</p>

                        <button
                            onClick={() => handleRegister('communication-only')}
                            className="theme-card p-6 rounded-2xl hover:bg-blue-500/10 dark:hover:bg-blue-900/10 hover:border-blue-500/50 transition-all text-left group"
                        >
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-black transition-colors">
                                    <MessageCircle size={24} />
                                </div>
                                <div className="font-bold text-lg">Ghost Mode</div>
                            </div>
                            <p className="text-xs theme-text-muted leading-relaxed pl-[4.5rem]">
                                Encrypted Messaging • Voice/Video Calls • No Social Feed • High Privacy • Burner Identity
                            </p>
                        </button>

                        <button
                            onClick={() => handleRegister('general')}
                            className="theme-card p-6 rounded-2xl hover:bg-pink-500/10 dark:hover:bg-pink-900/10 hover:border-pink-500/50 transition-all text-left group"
                        >
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-pink-500/20 rounded-lg text-pink-400 group-hover:bg-pink-500 group-hover:text-black transition-colors">
                                    <Eye size={24} />
                                </div>
                                <div className="font-bold text-lg">Social Mode</div>
                            </div>
                            <p className="text-xs theme-text-muted leading-relaxed pl-[4.5rem]">
                                Public Feed • Live Streaming • Content Creation • Monetization • Discovery
                            </p>
                        </button>
                    </div>
                )}

                <div className="mt-8 flex items-center justify-center gap-2 text-[10px] theme-text-muted font-mono italic uppercase tracking-widest">
                    <Shield size={12} /> Privacy protocol AES-256 standard enforced
                </div>
            </motion.div>
        </div>
    );
};
