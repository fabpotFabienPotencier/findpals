import { useState, useEffect } from 'react';
import { Loader2, DollarSign, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { payments } from '../services/api';

export const WalletPage = ({ 
    userProfile, 
    onDepositSuccess 
}: { 
    userProfile: any, 
    onDepositSuccess?: () => void 
}) => {
    const balance = userProfile ? Number(userProfile.walletBalance) : 0;
    
    // Deposit state
    const [depositAmount, setDepositAmount] = useState(20);
    const [depositLoading, setDepositLoading] = useState(false);
    
    // Withdrawal state
    const [withdrawAmount, setWithdrawAmount] = useState(10);
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [withdrawSuccess, setWithdrawSuccess] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);

    const fetchTransactions = async () => {
        setLoadingTransactions(true);
        try {
            const res = await payments.getTransactions();
            setTransactions(res.data);
        } catch (e) {
            console.error('Failed to fetch transactions:', e);
        } finally {
            setLoadingTransactions(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
        // Check if there's a Flutterwave redirect return status in the URL
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const txRef = params.get('tx_ref');
        
        if (status === 'successful' && txRef) {
            payments.flutterwaveVerify(txRef).then(() => {
                if (onDepositSuccess) onDepositSuccess();
                // Clear query parameters
                window.history.replaceState({}, document.title, window.location.pathname);
            }).catch((err) => {
                console.error('Failed to verify payment:', err);
            });
        }
    }, [userProfile]);

    const handleDeposit = async () => {
        if (depositAmount <= 0) return;
        setDepositLoading(true);
        setError(null);
        try {
            const res = await payments.flutterwaveInitialize(depositAmount, 'USD', window.location.href);
            window.location.href = res.data.link;
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to initialize payment');
        } finally {
            setDepositLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (withdrawAmount <= 0) return;
        if (withdrawAmount > balance) {
            setError('Insufficient wallet balance');
            return;
        }
        setWithdrawLoading(true);
        setError(null);
        setWithdrawSuccess(false);
        try {
            await payments.withdraw(withdrawAmount);
            setWithdrawSuccess(true);
            setWithdrawAmount(10);
            if (onDepositSuccess) onDepositSuccess(); // Refresh user profile (shares the same callback to refetch balance)
            fetchTransactions();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Withdrawal failed. Please try again.');
        } finally {
            setWithdrawLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
            <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                <DollarSign className="text-blue-500" /> Secure Wallet
            </h1>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-2 text-xs font-mono">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {withdrawSuccess && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl flex items-center gap-2 text-xs font-mono">
                    <CheckCircle2 size={16} /> Withdrawal requested and processed successfully!
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Balance Card */}
                <div className="md:col-span-3 bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[160px] bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div>
                        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500 mb-2">Available Balance</h2>
                        <div className="text-5xl font-bold font-mono text-white tracking-tight">${balance.toFixed(2)}</div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-4">
                        Securely encrypted vault
                    </div>
                </div>

                {/* Deposit Option */}
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-white/10 transition-all">
                    <div>
                        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                            <ArrowDownLeft className="text-green-400" size={16} /> Add Funds
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Top up your wallet using Flutterwave secure checkout gateway.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <span className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-400 font-mono flex items-center">$</span>
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(Number(e.target.value))}
                                className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 font-mono"
                                min={1}
                            />
                        </div>
                        <button
                            disabled={depositLoading || depositAmount <= 0}
                            onClick={handleDeposit}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                            {depositLoading ? <Loader2 size={14} className="animate-spin" /> : 'Deposit Now'}
                        </button>
                    </div>
                </div>

                {/* Withdraw Option */}
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-white/10 transition-all">
                    <div>
                        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                            <ArrowUpRight className="text-red-400" size={16} /> Cash Out
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Withdraw funds from your balance directly to your bank account.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <span className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-400 font-mono flex items-center">$</span>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                                className="w-full bg-[#0a0b1e]/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 font-mono"
                                min={1}
                            />
                        </div>
                        <button
                            disabled={withdrawLoading || withdrawAmount <= 0 || withdrawAmount > balance}
                            onClick={handleWithdraw}
                            className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                            {withdrawLoading ? <Loader2 size={14} className="animate-spin" /> : 'Withdraw Now'}
                        </button>
                    </div>
                </div>

                {/* Wallet Details/Tips */}
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white mb-2">Creator Ecosystem</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Support creators with tips, unlock paywalled streams, and cash out your subscription earnings directly to your fiat bank account.
                        </p>
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono">
                        Powered by FindPals Core Ledger
                    </div>
                </div>
            </div>

            {/* Recent Transactions List */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-slate-500 mb-6">Recent Transactions</h3>
                {loadingTransactions ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-blue-500" size={24} />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-10 text-slate-600 font-mono text-xs border border-dashed border-white/5 rounded-2xl">
                        No transactions recorded.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((tx) => {
                            const isDeposit = tx.type === 'deposit';
                            const isWithdrawal = tx.type === 'withdrawal';
                            const isSender = tx.fromUser?.id === userProfile?.id;
                            
                            let typeText = tx.type;
                            let amountText = '';
                            let colorClass = '';

                            if (isDeposit) {
                                typeText = 'Wallet Top-Up';
                                amountText = `+$${Number(tx.amount).toFixed(2)}`;
                                colorClass = 'text-green-400';
                            } else if (isWithdrawal) {
                                typeText = 'Bank Cash-Out';
                                amountText = `-$${Number(tx.amount).toFixed(2)}`;
                                colorClass = 'text-red-400';
                            } else {
                                amountText = isSender ? `-$${Number(tx.amount).toFixed(2)}` : `+$${Number(tx.amount).toFixed(2)}`;
                                colorClass = isSender ? 'text-red-400' : 'text-green-400';
                                typeText = isSender ? `Tip Sent to @${tx.toUser?.username}` : `Tip Received from @${tx.fromUser?.username}`;
                            }
                            
                            return (
                                <div key={tx.id} className="flex justify-between items-center bg-black/30 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                                    <div>
                                        <div className="text-white text-sm font-semibold">{typeText}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                                            {new Date(tx.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className={`font-mono font-bold text-sm ${colorClass}`}>{amountText}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
