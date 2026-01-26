import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Plus, Trash2, CreditCard, Tag, Info } from 'lucide-react';

const CATEGORIES = [
    { label: 'Food & Dining', value: 'Food', icon: '🍴' },
    { label: 'Transport', value: 'Transport', icon: '🚗' },
    { label: 'Home', value: 'Home', icon: '🏠' },
    { label: 'Lifestyle', value: 'Lifestyle', icon: '🎭' },
    { label: 'Bills', value: 'Bills', icon: '💳' },
    { label: 'Shopping', value: 'Shopping', icon: '📦' },
    { label: 'Misc', value: 'Misc', icon: '✨' },
];

export default function ExpenseWidget({ dateStr }) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Food');
    const [type, setType] = useState('EXPENSE'); // INCOME or EXPENSE
    const [accountId, setAccountId] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const queryClient = useQueryClient();

    // Accounts for selection
    const { data: accounts = [] } = useQuery({
        queryKey: ['finance', 'accounts'],
        queryFn: () => api.get('/finance/accounts').then(res => res.data),
        onSuccess: (data) => {
            if (data.length > 0 && !accountId) {
                const defaultAcc = data.find(a => a.is_default) || data[0];
                setAccountId(defaultAcc.id);
            }
        }
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['finance', 'transactions', dateStr],
        queryFn: () => api.get(`/finance/transactions/${dateStr}`).then(res => res.data)
    });

    const createTransaction = useMutation({
        mutationFn: (newTx) => api.post('/finance/transactions', newTx),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance'] });
            setAmount('');
            setDescription('');
            setIsAdding(false);
        }
    });

    const deleteTransaction = useMutation({
        mutationFn: (id) => api.delete(`/finance/transactions/${id}`), // Note: Need to implement delete in finance.py if missing
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance'] })
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || !description || !accountId) return;
        createTransaction.mutate({
            date: dateStr,
            amount: parseFloat(amount),
            description,
            category,
            type,
            account_id: accountId
        });
    };

    const dailyTotal = transactions.reduce((sum, tx) => tx.type === 'INCOME' ? sum + tx.amount : sum - tx.amount, 0);

    return (
        <section className="animate-in fade-in duration-500">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary/60 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span>Cash Flow</span>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-1 hover:bg-hover rounded transition-colors text-text-primary"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                <span className={`tabular-nums font-bold ${dailyTotal >= 0 ? 'text-emerald-500' : 'text-accent'}`}>
                    {dailyTotal >= 0 ? '+' : ''}₦{dailyTotal.toFixed(2)}
                </span>
            </h2>

            <div className="space-y-4">
                <div className="space-y-1">
                    {transactions.map(tx => (
                        <div key={tx.id} className="group flex items-center justify-between py-1.5 hover:bg-hover px-2 -mx-2 rounded transition-all text-sm">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className={`w-1.5 h-1.5 rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className="text-text-primary truncate">{tx.description}</span>
                                <span className="text-[10px] uppercase font-bold text-text-secondary/40 tracking-widest hidden sm:inline">
                                    {tx.category}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`font-bold tabular-nums ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-text-primary'}`}>
                                    {tx.type === 'INCOME' ? '+' : ''}₦{tx.amount.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && !isAdding && (
                        <p className="text-[10px] text-text-secondary italic text-center py-4">No transactions today.</p>
                    )}
                </div>

                {!isAdding ? (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-2 flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary hover:bg-hover px-2 -mx-2 rounded transition-all italic"
                    >
                        <Plus size={14} />
                        <span>Log income or expense...</span>
                    </button>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-surface/30 p-4 rounded-2xl border border-border-subtle space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl">
                        {/* Type Toggle */}
                        <div className="flex p-1 bg-background/50 rounded-xl border border-border-subtle">
                            <button
                                type="button"
                                onClick={() => setType('EXPENSE')}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${type === 'EXPENSE' ? 'bg-accent text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Expense
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('INCOME')}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${type === 'INCOME' ? 'bg-emerald-500 text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Income
                            </button>
                        </div>

                        {/* Account Selector */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Funding Account</label>
                            <select
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                className="w-full bg-background border border-border-subtle rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-primary"
                            >
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} (₦{acc.balance.toLocaleString()})</option>
                                ))}
                            </select>
                        </div>

                        {/* Category Selector (simplified) */}
                        <div className="flex flex-wrap gap-1">
                            {CATEGORIES.slice(0, 5).map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setCategory(cat.value)}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-tighter transition-all border ${category === cat.value ? 'bg-primary/20 border-primary text-primary' : 'border-transparent text-text-secondary'}`}
                                >
                                    {cat.icon}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <input
                                className="w-full bg-transparent border-b border-border-subtle focus:border-primary outline-none py-1 text-sm text-text-primary"
                                placeholder="What for?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                autoFocus
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-text-secondary font-bold">₦</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="flex-1 bg-transparent border-b border-border-subtle focus:border-primary outline-none py-1 text-lg font-bold text-text-primary tabular-nums"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setIsAdding(false)} className="text-[10px] font-bold uppercase text-text-secondary px-2">Cancel</button>
                            <button type="submit" className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase text-white shadow-lg transition-all hover:scale-105 ${type === 'INCOME' ? 'bg-emerald-500' : 'bg-primary'}`}>
                                Save Transaction
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
}
