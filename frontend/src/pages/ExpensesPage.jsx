import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, parseISO, subMonths, addMonths } from 'date-fns';
import api from '../api/client';
import {
    Trash2,
    ChevronLeft,
    ChevronRight,
    TrendingDown,
    TrendingUp,
    Wallet,
    Target
} from 'lucide-react';
import { SpendingTrendChart, CategoryPieChart } from '../components/ExpenseCharts';

export default function ExpensesPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const queryClient = useQueryClient();

    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    // Fetch Expenses for range
    const { data: expenses = [] } = useQuery({
        queryKey: ['expenses-range', startDate, endDate],
        queryFn: () => api.get(`/expenses/range?start_date=${startDate}&end_date=${endDate}`).then(res => res.data)
    });

    // Fetch Budgets (Assuming budgets endpoint exists)
    const { data: budgets = [] } = useQuery({
        queryKey: ['budgets'],
        queryFn: () => api.get('/budgets').then(res => res.data).catch(() => []) // Graceful fail if no endpoint
    });

    const deleteExp = useMutation({
        mutationFn: (id) => api.delete(`/expenses/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses-range'] })
    });

    // Metrics
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const prevMonthExpenses = 0; // Placeholder for now, could fetch prev month for comparison

    // Sort expenses details
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate budget progress
    const categorySpend = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {});

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Financial Dashboard</h1>
                    <p className="text-text-secondary text-sm italic">Track your spending and health.</p>
                </div>

                <div className="flex items-center gap-4 bg-surface p-2 rounded-xl border border-border-subtle">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-bold uppercase tracking-widest min-w-[120px] text-center">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Top Metrics Row */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title="Total Spent"
                        value={`₦${totalSpent.toLocaleString()}`}
                        icon={<Wallet className="text-blue-400" />}
                        subtext="For this month"
                    />
                    <MetricCard
                        title="Daily Average"
                        value={`₦${(totalSpent / new Date().getDate()).toFixed(0)}`}
                        icon={<TrendingUp className="text-orange-400" />}
                        subtext="Est. daily spend"
                    />
                    <MetricCard
                        title="Budget Health"
                        value="85%"
                        icon={<Target className="text-green-400" />}
                        subtext="Overall adherence"
                    />
                </div>

                {/* Main Charts Area */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Spending Trend */}
                    <div className="notion-card p-6 h-[400px]">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-6">Spending Trend</h3>
                        <SpendingTrendChart data={expenses} />
                    </div>

                    {/* Transaction List */}
                    <div className="notion-card p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold tracking-tight">Transactions</h3>
                            <button className="text-xs text-text-secondary hover:text-primary transition-colors">Export CSV</button>
                        </div>
                        <div className="space-y-2">
                            {sortedExpenses.length === 0 ? (
                                <div className="text-center py-12 text-text-secondary italic text-sm">No expenses this month.</div>
                            ) : (
                                sortedExpenses.map(exp => (
                                    <div key={exp.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors group border-b border-border-subtle/20 last:border-0">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center w-12">
                                                <p className="text-[10px] uppercase text-text-secondary font-bold">{format(parseISO(exp.date), 'MMM')}</p>
                                                <p className="text-lg font-bold leading-none">{format(parseISO(exp.date), 'dd')}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-text-primary">{exp.description}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                                                    <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">{exp.category}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <p className="font-bold tabular-nums text-text-primary">
                                                -₦{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Delete this expense?')) {
                                                        deleteExp.mutate(exp.id);
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Categories & Budgets */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Category Distribution */}
                    <div className="notion-card p-6 h-[350px]">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-4">By Category</h3>
                        <CategoryPieChart data={expenses} />
                    </div>

                    {/* Budgets */}
                    <div className="notion-card p-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-6">Budget Progress</h3>
                        <div className="space-y-6">
                            {/* Assuming some default categories or fetched budgets */}
                            {Object.entries(categorySpend).map(([cat, amount]) => {
                                // Mock budget for now, real implementation would match with `budgets` data
                                const limit = 50000;
                                const percent = Math.min((amount / limit) * 100, 100);
                                return (
                                    <div key={cat}>
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="font-bold">{cat}</span>
                                            <span className="text-text-secondary">₦{amount.toLocaleString()} / ₦{limit.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 bg-surface rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${percent > 90 ? 'bg-red-500' : 'bg-primary'}`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.keys(categorySpend).length === 0 && <p className="text-text-secondary text-xs italic">Start spending to see budgets.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, subtext }) {
    return (
        <div className="notion-card p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
                <span className="p-2 bg-surface rounded-lg">{icon}</span>
                {/* <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">+12%</span> */}
            </div>
            <div>
                <h3 className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-[10px] text-text-secondary mt-1">{subtext}</p>
            </div>
        </div>
    );
}
