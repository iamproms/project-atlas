import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    format, startOfMonth, endOfMonth, parseISO, subMonths, addMonths,
    isSameDay, isSameWeek, startOfWeek, endOfWeek
} from 'date-fns';
import api from '../api/client';
import {
    Trash2,
    ChevronLeft,
    ChevronRight,
    TrendingDown,
    TrendingUp,
    Wallet,
    Target,
    BarChart2,
    Plus,
    CreditCard
} from 'lucide-react';
import { SpendingTrendChart, CategoryPieChart } from '../components/ExpenseCharts';
import BudgetModal from '../components/BudgetModal';

export default function ExpensesPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showCharts, setShowCharts] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

    const queryClient = useQueryClient();

    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    // Fetch Expenses for range
    const { data: expenses = [] } = useQuery({
        queryKey: ['expenses-range', startDate, endDate],
        queryFn: () => api.get(`/expenses/range?start_date=${startDate}&end_date=${endDate}`).then(res => res.data)
    });

    // Fetch Budgets
    const { data: budgets = [] } = useQuery({
        queryKey: ['budgets'],
        queryFn: () => api.get('/budgets').then(res => res.data).catch(() => [])
    });

    const deleteExp = useMutation({
        mutationFn: (id) => api.delete(`/expenses/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses-range'] })
    });

    // --- Metrics Calculations ---
    const today = new Date();

    // Total Month
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Total Today
    const spentToday = expenses
        .filter(e => isSameDay(parseISO(e.date), today))
        .reduce((sum, e) => sum + e.amount, 0);

    // Total Week
    const spentThisWeek = expenses
        .filter(e => isSameWeek(parseISO(e.date), today, { weekStartsOn: 1 })) // Monday start
        .reduce((sum, e) => sum + e.amount, 0);

    // Budget Health (Total Spent vs Total Budget Limits)
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.amount, 0);
    const budgetHealth = totalBudgetLimit > 0
        ? Math.min((totalSpent / totalBudgetLimit) * 100, 100).toFixed(0)
        : 0;

    // --- Grouping for Daily List ---
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    const groupedExpenses = sortedExpenses.reduce((acc, curr) => {
        const dateKey = curr.date; // "YYYY-MM-DD"
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(curr);
        return acc;
    }, {});

    // Category Spend for Budget Bars
    const categorySpend = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {});

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">

            {/* Header & Controls */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Financial Dashboard</h1>
                    <p className="text-text-secondary text-sm italic">Track your spending, budgets, and habits.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowCharts(!showCharts)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${showCharts ? 'bg-primary text-white border-primary' : 'bg-surface text-text-secondary border-border-subtle hover:bg-white/5'}`}
                    >
                        <BarChart2 size={16} />
                        In-Depth Analysis
                    </button>

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
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Spent Today"
                    value={`₦${spentToday.toLocaleString()}`}
                    icon={<CreditCard className="text-purple-400" />}
                    subtext={format(today, 'EEEE, MMM do')}
                />
                <MetricCard
                    title="Spent This Week"
                    value={`₦${spentThisWeek.toLocaleString()}`}
                    icon={<TrendingUp className="text-orange-400" />}
                    subtext="Mon - Sun"
                />
                <MetricCard
                    title="Month Total"
                    value={`₦${totalSpent.toLocaleString()}`}
                    icon={<Wallet className="text-blue-400" />}
                    subtext="Total Outflow"
                />
                <MetricCard
                    title="Budget Used"
                    value={`${budgetHealth}%`}
                    icon={<Target className="text-green-400" />}
                    subtext={totalBudgetLimit > 0 ? `of ₦${totalBudgetLimit.toLocaleString()}` : "No budgets set"}
                />
            </div>

            {/* Collapsible In-Depth Analysis */}
            {showCharts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="notion-card p-6 h-[400px]">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-6">Spending Trend</h3>
                        <SpendingTrendChart data={expenses} />
                    </div>
                    <div className="notion-card p-6 h-[400px]">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-6">Category Breakdown</h3>
                        <CategoryPieChart data={expenses} />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Transaction List (Daily Groups) */}
                <div className="lg:col-span-8">
                    <div className="notion-card p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold tracking-tight">Transactions</h3>
                            <button className="text-xs text-text-secondary hover:text-primary transition-colors">Export CSV</button>
                        </div>

                        {/* Grouped List */}
                        <div className="space-y-8">
                            {Object.keys(groupedExpenses).length === 0 ? (
                                <div className="text-center py-12 text-text-secondary italic text-sm">No expenses recorded for this month.</div>
                            ) : (
                                Object.entries(groupedExpenses).map(([dateStr, exps]) => (
                                    <div key={dateStr}>
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4 border-b border-border-subtle/30 pb-2">
                                            {isSameDay(parseISO(dateStr), today) ? 'Today' : format(parseISO(dateStr), 'EEEE, MMMM do')}
                                            <span className="float-right text-text-primary">
                                                -₦{exps.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                                            </span>
                                        </h4>
                                        <div className="space-y-2">
                                            {exps.map(exp => (
                                                <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                                                    <div className="flex items-center gap-4">
                                                        <div>
                                                            <p className="text-sm font-bold text-text-primary">{exp.description}</p>
                                                            <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">{exp.category}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <p className="font-bold tabular-nums text-text-primary text-sm">
                                                            -₦{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </p>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Delete this expense?')) {
                                                                    deleteExp.mutate(exp.id);
                                                                }
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Budgets */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="notion-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Budgets</h3>
                            <button
                                onClick={() => setIsBudgetModalOpen(true)}
                                className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors font-bold uppercase tracking-widest"
                            >
                                <Plus size={12} /> Manage
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Fetch all categories from expenses + existing budgets */}
                            {Array.from(new Set([...Object.keys(categorySpend), ...budgets.map(b => b.category)])).map(cat => {
                                const spent = categorySpend[cat] || 0;
                                const budgetObj = budgets.find(b => b.category === cat);
                                const limit = budgetObj ? budgetObj.amount : 0;

                                const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                                const isOver = spent > limit && limit > 0;

                                return (
                                    <div key={cat}>
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="font-bold">{cat}</span>
                                            <span className="text-text-secondary">
                                                ₦{spent.toLocaleString()}
                                                <span className="mx-1">/</span>
                                                {limit > 0 ? `₦${limit.toLocaleString()}` : <span className="text-text-secondary/50">--</span>}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-surface rounded-full overflow-hidden relative">
                                            {limit === 0 && <div className="absolute inset-0 bg-white/5" />}
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-primary'}`}
                                                style={{ width: `${limit > 0 ? percent : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.keys(categorySpend).length === 0 && budgets.length === 0 && (
                                <p className="text-text-secondary text-xs italic text-center py-4">Set a budget to get started.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <BudgetModal
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                existingBudgets={budgets}
            />
        </div>
    );
}

function MetricCard({ title, value, icon, subtext }) {
    return (
        <div className="notion-card p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
                <span className="p-2 bg-surface rounded-lg">{icon}</span>
            </div>
            <div>
                <h3 className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-[10px] text-text-secondary mt-1">{subtext}</p>
            </div>
        </div>
    );
}
