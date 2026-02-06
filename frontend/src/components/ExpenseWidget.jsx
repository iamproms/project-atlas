import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Plus, Trash2 } from 'lucide-react';

const DEFAULT_CATEGORIES = [
    'Food', 'Transport', 'Home', 'Lifestyle', 'Bills', 'Shopping', 'Health', 'Education', 'Gift', 'Misc'
];

export default function ExpenseWidget({ dateStr }) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Food');
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const queryClient = useQueryClient();

    const { data: expenses = [] } = useQuery({
        queryKey: ['expenses', dateStr],
        queryFn: () => api.get(`/expenses/${dateStr}`).then(res => res.data)
    });

    const createExpense = useMutation({
        mutationFn: (newExp) => api.post('/expenses/', newExp),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses', dateStr] });
            // Also invalidate range based queries to update dashboards
            queryClient.invalidateQueries({ queryKey: ['expenses-range'] });
            setAmount('');
            setDescription('');
            if (isCustomCategory) setCategory('Food');
            setIsCustomCategory(false);
            setIsAdding(false);
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || !description) return;
        createExpense.mutate({
            date: dateStr,
            amount: parseFloat(amount),
            description,
            category: category.trim()
        });
    };

    const dailyTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <section className="animate-in fade-in duration-500">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary/60 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span>Expenses</span>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-1 hover:bg-hover rounded transition-colors text-text-primary"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <span className="tabular-nums font-bold text-accent">
                    -₦{dailyTotal.toFixed(2)}
                </span>
            </h2>

            <div className="space-y-4">
                <div className="space-y-1">
                    {expenses.map(exp => (
                        <div key={exp.id} className="group flex items-center justify-between py-1.5 hover:bg-hover px-2 -mx-2 rounded transition-all text-sm">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <span className="text-text-primary truncate">{exp.description}</span>
                                <span className="text-[9px] uppercase font-bold text-text-secondary/40 tracking-widest">{exp.category}</span>
                            </div>
                            <span className="font-bold tabular-nums text-text-primary">
                                -₦{exp.amount.toFixed(2)}
                            </span>
                        </div>
                    ))}
                    {expenses.length === 0 && !isAdding && (
                        <p className="text-[10px] text-text-secondary italic text-center py-4">No expenses today.</p>
                    )}
                </div>

                {isSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest py-2 rounded-xl text-center animate-in fade-in zoom-in duration-300">
                        Saved ✓
                    </div>
                )}

                {!isAdding ? (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-2 flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary hover:bg-hover px-2 -mx-2 rounded transition-all italic"
                    >
                        <Plus size={18} />
                        <span>Log something...</span>
                    </button>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-surface/30 p-4 rounded-2xl border border-border-subtle space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl">

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] uppercase font-bold text-text-secondary">Category</label>
                                <button
                                    type="button"
                                    onClick={() => { setIsCustomCategory(!isCustomCategory); setCategory(isCustomCategory ? 'Food' : ''); }}
                                    className="text-[10px] text-primary hover:underline"
                                >
                                    {isCustomCategory ? 'Select List' : 'Custom'}
                                </button>
                            </div>

                            {isCustomCategory ? (
                                <input
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="Enter category name"
                                    className="w-full bg-background border border-border-subtle rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-primary"
                                    autoFocus
                                    required
                                />
                            ) : (
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-background border border-border-subtle rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none"
                                >
                                    {DEFAULT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            )}
                        </div>

                        <div className="space-y-3">
                            <input
                                className="w-full bg-transparent border-b border-border-subtle focus:border-primary outline-none py-1 text-sm text-text-primary"
                                placeholder="What for?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
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
                            <button type="submit" className="px-4 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold uppercase shadow-lg transition-all hover:scale-105">
                                Save
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
}
