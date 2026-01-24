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
    const [isAdding, setIsAdding] = useState(false);

    const queryClient = useQueryClient();

    const { data: expenses = [] } = useQuery({
        queryKey: ['expenses', dateStr],
        queryFn: () => api.get(`/expenses/${dateStr}`).then(res => res.data)
    });

    const createExpense = useMutation({
        mutationFn: (newExpense) => api.post('/expenses/', newExpense),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses', dateStr] });
            setAmount('');
            setDescription('');
            setIsAdding(false);
        }
    });

    const deleteExpense = useMutation({
        mutationFn: (id) => api.delete(`/expenses/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses', dateStr] })
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || !description) return;
        createExpense.mutate({
            date: dateStr,
            amount: parseFloat(amount),
            description,
            category
        });
    };

    const dailyTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <section className="animate-in fade-in duration-500">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary/60 mb-6 flex items-center gap-2">
                <span>Expenses</span>
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-1 hover:bg-hover rounded transition-colors text-text-primary"
                    title="Add Expense"
                >
                    <Plus size={14} />
                </button>
                <div className="h-px flex-1 bg-border-subtle" />
                <span className="text-text-primary tabular-nums">₦{dailyTotal.toFixed(2)}</span>
            </h2>

            <div className="space-y-4">
                {/* Entry List */}
                <div className="space-y-1">
                    {expenses.map(exp => (
                        <div key={exp.id} className="group flex items-center justify-between py-1.5 hover:bg-hover px-2 -mx-2 rounded transition-all text-sm">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-lg grayscale group-hover:grayscale-0 transition-all w-6 text-center">
                                    {CATEGORIES.find(c => c.value === exp.category)?.icon || '✨'}
                                </span>
                                <span className="text-text-primary truncate">{exp.description}</span>
                                <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest hidden sm:inline opacity-40">
                                    {exp.category}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-medium text-text-primary tabular-nums">₦{exp.amount.toFixed(2)}</span>
                                <button
                                    onClick={() => deleteExpense.mutate(exp.id)}
                                    className="text-text-secondary hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Button/Form */}
                {!isAdding ? (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-2 flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary hover:bg-hover px-2 -mx-2 rounded transition-all italic"
                    >
                        <Plus size={14} />
                        <span>Add an expense...</span>
                    </button>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-surface/30 p-4 rounded border border-border-subtle space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setCategory(cat.value)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${category === cat.value
                                        ? 'bg-primary/10 border-primary/40 text-primary'
                                        : 'border-transparent text-text-secondary hover:bg-hover'
                                        }`}
                                >
                                    {cat.icon} {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <input
                                className="flex-1 notion-input text-base"
                                placeholder="Description (e.g. Lunch with team)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                autoFocus
                            />
                            <div className="relative w-24">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-text-secondary px-2">₦</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full notion-input text-base pl-6 text-right"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1.5 bg-primary text-background rounded text-xs font-bold hover:opacity-90 transition-opacity"
                            >
                                Save Entry
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
}
