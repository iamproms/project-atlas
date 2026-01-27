import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Plus, Trash2, CreditCard, Tag, Info } from 'lucide-react';

export default function ExpenseWidget({ dateStr }) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState(null);
    const [type, setType] = useState('EXPENSE'); // INCOME or EXPENSE
    const [accountId, setAccountId] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const queryClient = useQueryClient();

    // 1. Fetch Categories based on Type
    const { data: categories = [] } = useQuery({
        queryKey: ['finance', 'categories', type],
        queryFn: () => api.get('/finance/categories', { params: { type } }).then(res => res.data)
    });

    // 2. Fetch Accounts
    const { data: accounts = [] } = useQuery({
        queryKey: ['finance', 'accounts'],
        queryFn: () => api.get('/finance/accounts').then(res => res.data)
    });

    // 3. Fetch Ledger for today
    const { data: ledger = [] } = useQuery({
        queryKey: ['finance', 'ledger', dateStr],
        queryFn: () => api.get('/finance/ledger', { params: { date: dateStr } }).then(res => res.data)
    });

    // Auto-select defaults
    useEffect(() => {
        if (accounts.length > 0 && !accountId) {
            const defaultAcc = accounts.find(a => a.is_default) || accounts[0];
            setAccountId(defaultAcc.id);
        }
        if (categories.length > 0 && !categoryId) {
            setCategoryId(categories[0].id);
        }
    }, [accounts, categories, accountId, categoryId]);

    // Mutations
    const createEntry = useMutation({
        mutationFn: (newEntry) => api.post('/finance/ledger', newEntry),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance'] });
            setAmount('');
            setDescription('');
            setIsAdding(false);
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || !description || !accountId) return;

        // Convert to cents (Professional handling)
        const amountCents = Math.round(parseFloat(amount) * 100);

        createEntry.mutate({
            date: dateStr,
            amount_cents: amountCents,
            description,
            category_id: categoryId,
            type,
            account_id: accountId
        });
    };

    const dailyTotalCents = ledger.reduce((sum, entry) =>
        entry.type === 'INCOME' ? sum + entry.amount_cents : sum - entry.amount_cents, 0
    );

    return (
        <section className="animate-in fade-in duration-500">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary/60 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span>Cash Ledger</span>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-1 hover:bg-hover rounded transition-colors text-text-primary"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <span className={`tabular-nums font-bold ${dailyTotalCents >= 0 ? 'text-emerald-500' : 'text-accent'}`}>
                    {dailyTotalCents >= 0 ? '+' : ''}₦{(dailyTotalCents / 100).toFixed(2)}
                </span>
            </h2>

            <div className="space-y-4">
                <div className="space-y-1">
                    {ledger.map(entry => (
                        <div key={entry.id} className="group flex items-center justify-between py-1.5 hover:bg-hover px-2 -mx-2 rounded transition-all text-sm">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className={`w-1.5 h-1.5 rounded-full ${entry.type === 'INCOME' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className="text-text-primary truncate">{entry.description}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`font-bold tabular-nums ${entry.type === 'INCOME' ? 'text-emerald-500' : 'text-text-primary'}`}>
                                    {entry.type === 'INCOME' ? '+' : ''}₦{(entry.amount_cents / 100).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                    {ledger.length === 0 && !isAdding && (
                        <p className="text-[10px] text-text-secondary italic text-center py-4">Secure ledger is empty today.</p>
                    )}
                </div>

                {isSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest py-2 rounded-xl text-center animate-in fade-in zoom-in duration-300">
                        Ledger Verified ✓
                    </div>
                )}

                {!isAdding ? (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-2 flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary hover:bg-hover px-2 -mx-2 rounded transition-all italic"
                    >
                        <Plus size={18} />
                        <span>Add ledger entry...</span>
                    </button>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-surface/30 p-4 rounded-2xl border border-border-subtle space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl">
                        {/* Type Toggle */}
                        <div className="flex p-1 bg-background/50 rounded-xl border border-border-subtle">
                            <button
                                type="button"
                                onClick={() => { setType('EXPENSE'); setCategoryId(null); }}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${type === 'EXPENSE' ? 'bg-accent text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Expense
                            </button>
                            <button
                                type="button"
                                onClick={() => { setType('INCOME'); setCategoryId(null); }}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${type === 'INCOME' ? 'bg-emerald-500 text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Income
                            </button>
                        </div>

                        {/* Category Grid */}
                        <div className="grid grid-cols-5 gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategoryId(cat.id)}
                                    title={cat.name}
                                    className={`aspect-square flex flex-col items-center justify-center rounded-xl text-lg transition-all border-2 ${categoryId === cat.id ? 'bg-primary/20 border-primary scale-110 shadow-lg' : 'bg-background/40 border-border-subtle hover:border-text-secondary/30 grayscale hover:grayscale-0'}`}
                                >
                                    <span>{cat.icon}</span>
                                    <span className="text-[7px] uppercase font-bold mt-1 tracking-tighter truncate w-full px-1">{cat.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <input
                                className="w-full bg-transparent border-b border-border-subtle focus:border-primary outline-none py-1 text-sm text-text-primary"
                                placeholder="Description (e.g. Weekly Groceries)"
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

                        {/* Account Selection */}
                        <select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="w-full bg-background border border-border-subtle rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none"
                        >
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} (₦{(acc.balance_cents / 100).toLocaleString()})</option>
                            ))}
                        </select>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setIsAdding(false)} className="text-[10px] font-bold uppercase text-text-secondary px-2">Cancel</button>
                            <button type="submit" className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase text-white shadow-lg transition-all hover:scale-105 ${type === 'INCOME' ? 'bg-emerald-500' : 'bg-primary'}`}>
                                Commit to Ledger
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
}
