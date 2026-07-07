import { useState } from 'react';
import { payments } from '../services/api';

export const WalletPage = () => {
    const [balance, setBalance] = useState(1250.50); // Mock balance
    const [depositAmount, setDepositAmount] = useState(20);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDeposit = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await payments.flutterwaveInitialize(depositAmount, 'USD', window.location.origin);
            window.location.href = res.data.link;
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to initialize payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-4xl font-bold text-neon-green mb-8">findpals Wallet</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-900 border border-neon-purple p-6 rounded-lg">
                    <h2 className="text-gray-400 mb-2">Total Balance</h2>
                    <div className="text-5xl font-mono mb-4">${balance.toFixed(2)}</div>
                    {error && <div className="text-xs text-red-400 mb-3">{error}</div>}
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(Number(e.target.value))}
                                className="w-24 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm"
                                min={1}
                            />
                            <button
                                disabled={loading}
                                onClick={handleDeposit}
                                className="bg-neon-green text-black px-6 py-2 rounded font-bold hover:bg-green-400 transition disabled:opacity-60"
                            >
                                {loading ? '...' : 'Deposit'}
                            </button>
                        </div>
                        <button className="border border-neon-red text-neon-red px-6 py-2 rounded font-bold hover:bg-neon-red hover:text-white transition">
                            Withdraw
                        </button>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Recent Transactions</h3>
                    <ul className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="flex justify-between items-center border-b border-gray-800 pb-2">
                                <div>
                                    <div className="text-white">Tip from @user_{i}</div>
                                    <div className="text-xs text-gray-500">2 hours ago</div>
                                </div>
                                <div className="text-neon-green">+$50.00</div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
