import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { X, Plus } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../utils/constants';

export default function BudgetModal({ isOpen, onClose, existingBudgets = [] }) {
    const [category, setCategory] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [amount, setAmount] = useState('');
    const [period, setPeriod] = useState('MONTHLY');
    const queryClient = useQueryClient();

    const saveBudget = useMutation({
        mutationFn: (data) => api.post('/budgets/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
            onClose();
            setCategory('');
            setAmount('');
            setIsCustom(false);
        }
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        saveBudget.mutate({
            category: category.trim(), // Ensure no whitespace issues
            amount: parseFloat(amount),
            period
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#202020] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-bold">Set Budget</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X size={18} className="text-text-secondary" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Category</label>
                            <button
                                type="button"
                                onClick={() => { setIsCustom(!isCustom); setCategory(''); }}
                                className="text-[10px] text-primary hover:underline"
                            >
                                {isCustom ? 'Select from list' : 'Enter custom'}
                            </button>
                        </div>

                        {isCustom ? (
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                                autoFocus
                                className="w-full bg-[#151515] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary"
                                placeholder="e.g. Subscriptions"
                            />
                        ) : (
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                                className="w-full bg-[#151515] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary appearance-none"
                            >
                                <option value="" disabled>Select a category</option>
                                {DEFAULT_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-2 block">Monthly Limit (₦)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            className="w-full bg-[#151515] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary"
                            placeholder="e.g. 50000"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-text-secondary hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saveBudget.isPending}
                            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saveBudget.isPending ? 'Saving...' : 'Save Budget'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
