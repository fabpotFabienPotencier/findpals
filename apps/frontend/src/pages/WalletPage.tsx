import { useState, useEffect } from 'react';
import { payments } from '../services/api';

export const WalletPage = ({ 
    userProfile, 
    onDepositSuccess 
}: { 
    userProfile: any, 
    onDepositSuccess?: () => void 
}) => {
    const balance = userProfile ? Number(userProfile.walletBalance) : 0;
    const [depositAmount, setDepositAmount] = useState(20);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);

    const fetchTransactions = async () => {
        try {
            const res = await payments.getTransactions();
            setTransactions(res.data);
        } catch (e) {
            console.error('Failed to fetch transactions:', e);
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
        setLoading(true);
        setError(null);
        try {
            const res = await payments.flutterwaveInitialize(depositAmount, 'USD', window.location.href);
            window.location.href = res.data.link;
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to initialize payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-4xl font-bold text-cyan-400 mb-8">findpals Wallet</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-900 border border-cyan-500/20 p-6 rounded-lg">
                    <h2 className="text-gray-400 mb-2">Total Balance</h2>
                    <div className="text-5xl font-mono mb-4">${balance.toFixed(2)}</div>
                    {error && <div className="text-xs text-red-400 mb-3">{error}</div>}
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(Number(e.target.value))}
                                className="w-24 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                min={1}
                            />
                            <button
                                disabled={loading}
                                onClick={handleDeposit}
                                className="bg-cyan-500 text-black px-6 py-2 rounded font-bold hover:bg-cyan-400 transition disabled:opacity-60"
                            >
                                {loading ? '...' : 'Deposit'}
                            </button>
                        </div>
                        <button className="border border-red-500 text-red-500 px-6 py-2 rounded font-bold hover:bg-red-500 hover:text-white transition">
                            Withdraw
                        </button>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Recent Transactions</h3>
                    {transactions.length === 0 ? (
                        <div className="text-sm text-slate-500">No transactions recorded yet.</div>
                    ) : (
                        <ul className="space-y-4">
                            {transactions.map((tx) => {
                                const isDeposit = tx.type === 'deposit';
                                const isSender = tx.fromUser?.id === userProfile?.id;
                                const amountText = isDeposit || !isSender ? `+$${Number(tx.amount).toFixed(2)}` : `-$${Number(tx.amount).toFixed(2)}`;
                                const colorClass = isDeposit || !isSender ? 'text-green-400' : 'text-red-400';
                                
                                return (
                                    <li key={tx.id} className="flex justify-between items-center border-b border-gray-800 pb-2">
                                        <div>
                                            <div className="text-white capitalize">
                                                {tx.type} {isDeposit ? '' : isSender ? `to @${tx.toUser?.username}` : `from @${tx.fromUser?.username}`}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                                            </div>
                                        </div>
                                        <div className={colorClass}>{amountText}</div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};
