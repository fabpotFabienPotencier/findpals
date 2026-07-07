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
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0a0b1e]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black italic mb-2">findpals <span className="text-cyan-400">social</span></h1>
                    <p className="text-slate-500 font-mono text-xs tracking-widest uppercase">
                        {step === 'auth' ? 'Identity Verification' : 'Operational Protocol'}
                    </p>
                </div>

                {step === 'auth' && (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                        <div className="flex gap-4 mb-8 bg-black/20 p-1 rounded-xl">
                            <button
                                onClick={() => setAuthType('login')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authType === 'login' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
                            >
                                LOGIN
                            </button>
                            <button
                                onClick={() => setAuthType('register')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authType === 'register' ? 'bg-pink-500/20 text-pink-400' : 'text-slate-500 hover:text-white'}`}
                            >
                                REGISTER
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 font-bold ml-2">CODENAME</label>
                                <div className="relative mt-1">
                                    <Shield className="absolute left-4 top-3 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                        placeholder="Enter pseudonym..."
                                    />
                                </div>
                            </div>
                            {authType === 'register' && (
                                <div>
                                    <label className="text-xs text-slate-400 font-bold ml-2">RECOVERY EMAIL</label>
                                    <div className="relative mt-1">
                                        <Shield className="absolute left-4 top-3 text-slate-500" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                            placeholder="Enter valid email address..."
                                        />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="text-xs text-slate-400 font-bold ml-2">2FA CODE (IF ENABLED)</label>
                                <div className="relative mt-1">
                                    <input
                                        type="text"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500/50 transition-colors tracking-[0.3em] text-sm"
                                        placeholder="------"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold ml-2">ACCESS KEY</label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-4 top-3 text-slate-500" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && <div className="mt-4 text-red-400 text-xs text-center">{error}</div>}

                        <button
                            onClick={handleAuth}
                            disabled={loading || !username || !password}
                            className="w-full mt-8 bg-white text-black font-bold py-4 rounded-xl hover:bg-cyan-400 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
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
                        <p className="text-slate-400 text-sm text-center mb-4">Select your interaction protocol. This can be changed later.</p>

                        <button
                            onClick={() => handleRegister('communication-only')}
                            className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all text-left group"
                        >
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-cyan-500/20 rounded-lg text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                                    <MessageCircle size={24} />
                                </div>
                                <div className="font-bold text-lg text-white">Ghost Mode</div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed pl-[4.5rem]">
                                Encrypted Messaging • Voice/Video Calls • No Social Feed • High Privacy • Burner Identity
                            </p>
                        </button>

                        <button
                            onClick={() => handleRegister('general')}
                            className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-pink-500/10 hover:border-pink-500/50 transition-all text-left group"
                        >
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-pink-500/20 rounded-lg text-pink-400 group-hover:bg-pink-500 group-hover:text-black transition-colors">
                                    <Eye size={24} />
                                </div>
                                <div className="font-bold text-lg text-white">Social Mode</div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed pl-[4.5rem]">
                                Public Feed • Live Streaming • Content Creation • Monetization • Discovery
                            </p>
                        </button>
                    </div>
                )}

                <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-slate-600 font-mono italic uppercase tracking-widest">
                    <Shield size={12} /> Privacy protocol AES-256 standard enforced
                </div>
            </motion.div>
        </div>
    );
};
