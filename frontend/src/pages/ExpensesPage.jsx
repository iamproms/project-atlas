import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import api from '../api/client';
import {
    Trash2,
    Download,
    Filter
} from 'lucide-react';

function ExpenseList({ today }) {
    const { data: expenses = [] } = useQuery({
        queryKey: ['expenses', today],
        queryFn: () => api.get(`/expenses/${today}`).then(res => res.data)
    });

    const queryClient = useQueryClient();
    const deleteExp = useMutation({
        mutationFn: (id) => api.delete(`/expenses/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] })
    });

    return (
        <div className="space-y-4">
            {expenses.length === 0 ? (
                <div className="text-center py-12 text-text-secondary italic text-sm">No expenses for this date.</div>
            ) : (
                expenses.map(exp => (
                    <div key={exp.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface/50 border border-transparent hover:border-border-subtle transition-all group">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center text-xl">
                                📉
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-primary">{exp.description}</p>
                                <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">{exp.category}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <p className="font-bold tabular-nums text-text-primary">
                                -₦{exp.amount.toFixed(2)}
                            </p>
                            <button
                                onClick={() => {
                                    if (window.confirm('Delete this expense?')) {
                                        deleteExp.mutate(exp.id);
                                    }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:text-accent transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default function ExpensesPage() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [selectedDate, setSelectedDate] = useState(today);

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">
            <div className="mb-12 flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Expenses</h1>
                    <p className="text-text-secondary text-sm italic">Direct, simple tracking.</p>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-surface border border-border-subtle rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest outline-none focus:border-primary"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <div className="notion-card p-10">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-xl font-bold tracking-tight">Daily List</h3>
                            <p className="text-xs text-text-secondary">{format(new Date(selectedDate), 'MMMM do, yyyy')}</p>
                        </div>
                        <ExpenseList today={selectedDate} />
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <section className="notion-card p-8 bg-primary/5 border-primary/10">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-4">Total for {format(new Date(selectedDate), 'MMM d')}</h3>
                        <SummaryTotal date={selectedDate} />
                    </section>
                </div>
            </div>
        </div>
    );
}

function SummaryTotal({ date }) {
    const { data: expenses = [] } = useQuery({
        queryKey: ['expenses', date],
        queryFn: () => api.get(`/expenses/${date}`).then(res => res.data)
    });
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    return (
        <p className="text-4xl font-bold text-accent tabular-nums">₦{total.toFixed(2)}</p>
    );
}
