import React, { useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import api from '../api/client';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Wallet, TrendingUp, Calendar, ArrowRight } from 'lucide-react';

const CATEGORIES = [
    { label: 'Food & Dining', value: 'Food', color: '#2eaadc' },
    { label: 'Transport', value: 'Transport', color: '#94a3b8' },
    { label: 'Home', value: 'Home', color: '#f59e0b' },
    { label: 'Lifestyle', value: 'Lifestyle', color: '#ec4899' },
    { label: 'Bills', value: 'Bills', color: '#ef4444' },
    { label: 'Shopping', value: 'Shopping', color: '#10b981' },
    { label: 'Misc', value: 'Misc', color: '#6366f1' },
];

const DEFAULT_BUDGETS = {
    'Food': 50000,
    'Transport': 20000,
    'Home': 100000,
    'Lifestyle': 30000,
    'Bills': 40000,
    'Shopping': 25000,
    'Misc': 10000
};

export default function ExpensesPage() {
    const today = new Date();
    const queryClient = useQueryClient();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });

    // Summary Query for the last 30 days
    const { data: summary = {} } = useQuery({
        queryKey: ['expenses', 'summary', '30days'],
        queryFn: () => api.get('/expenses/stats/summary', {
            params: {
                start_date: format(subDays(today, 30), 'yyyy-MM-dd'),
                end_date: format(today, 'yyyy-MM-dd')
            }
        }).then(res => res.data)
    });

    const { data: dailySummary = {} } = useQuery({
        queryKey: ['expenses', 'summary', 'daily'],
        queryFn: () => api.get('/expenses/stats/summary', {
            params: {
                start_date: format(today, 'yyyy-MM-dd'),
                end_date: format(today, 'yyyy-MM-dd')
            }
        }).then(res => res.data)
    });

    const { data: weeklySummary = {} } = useQuery({
        queryKey: ['expenses', 'summary', 'weekly'],
        queryFn: () => api.get('/expenses/stats/summary', {
            params: {
                start_date: format(startOfCurrentWeek, 'yyyy-MM-dd'),
                end_date: format(endOfCurrentWeek, 'yyyy-MM-dd')
            }
        }).then(res => res.data)
    });

    const { data: userBudgets = [] } = useQuery({
        queryKey: ['budgets'],
        queryFn: () => api.get('/budgets/').then(res => res.data)
    });

    const budgetMap = useMemo(() => {
        const map = { ...DEFAULT_BUDGETS };
        userBudgets.forEach(b => {
            map[b.category] = b.amount;
        });
        return map;
    }, [userBudgets]);

    const updateBudget = useMutation({
        mutationFn: (newBudget) => api.post('/budgets/', newBudget),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
    });

    // Expenses for the current week to build trend
    const dayInterval = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek });

    // In a real app, you'd have a specific trend endpoint.
    // Totals
    const monthlyTotal = Object.values(summary).reduce((a, b) => a + b, 0);
    const weeklyTotal = Object.values(weeklySummary).reduce((a, b) => a + b, 0);
    const dailyTotal = Object.values(dailySummary).reduce((a, b) => a + b, 0);

    const chartData = useMemo(() => {
        return CATEGORIES.map(cat => ({
            name: cat.label,
            value: summary[cat.value] || 0,
            color: cat.color
        })).filter(d => d.value > 0);
    }, [summary]);

    const { theme } = useTheme();
    const axisColor = theme === 'dark' ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
    const gridColor = theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const tooltipBg = theme === 'dark' ? "#202020" : "#ffffff";
    const tooltipBorder = theme === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">
            <div className="mb-12">
                <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default mb-2">
                    💰
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Expenses</h1>
                <p className="text-text-secondary text-sm">Financial health and spending habits.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
                <div className="notion-card p-6 border-l-4 border-l-primary flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Spent Today</p>
                        <p className="text-3xl font-bold text-text-primary tabular-nums">₦{dailyTotal.toLocaleString()}</p>
                    </div>
                </div>

                <div className="notion-card p-6 border-l-4 border-l-accent flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Spent This Week</p>
                        <p className="text-3xl font-bold text-text-primary tabular-nums">₦{weeklyTotal.toLocaleString()}</p>
                    </div>
                </div>

                <div className="notion-card p-6 border-l-4 border-l-text-secondary flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Spent (30 Days)</p>
                        <p className="text-3xl font-bold text-text-primary tabular-nums">₦{monthlyTotal.toLocaleString()}</p>
                    </div>
                </div>

                <div className="notion-card p-6 border-l-4 border-l-emerald-500 flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Total Monthly Budget</p>
                        <p className="text-3xl font-bold text-text-primary tabular-nums">₦{Object.values(budgetMap).reduce((a, b) => a + b, 0).toLocaleString()}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                        <span className={monthlyTotal > Object.values(budgetMap).reduce((a, b) => a + b, 0) ? "text-red-500" : "text-emerald-500"}>
                            {((monthlyTotal / (Object.values(budgetMap).reduce((a, b) => a + b, 0) || 1)) * 100).toFixed(1)}% Used
                        </span>
                    </div>
                </div>

                <div className="md:col-span-4 notion-card p-6 flex flex-col justify-center">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6">Spending by Category (30 Days)</h3>
                    {chartData.length > 0 ? (
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" stroke={axisColor} fontSize={10} width={80} />
                                    <Tooltip
                                        cursor={{ fill: gridColor }}
                                        contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '4px', color: theme === 'dark' ? '#fff' : '#000' }}
                                        itemStyle={{ color: theme === 'dark' ? '#D3D3D3' : '#333', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-sm text-text-secondary italic">
                            Not enough data for visualization.
                        </div>
                    )}
                </div>
            </div>

            <section className="space-y-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary/60 flex items-center gap-2">
                    <span>Breakdown</span>
                    <div className="h-px flex-1 bg-border-subtle" />
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {CATEGORIES.map(cat => {
                        const spent = summary[cat.value] || 0;
                        const budget = budgetMap[cat.value] || 0;
                        const percentage = Math.min(100, (spent / budget) * 100);
                        const isOver = spent > budget;

                        return (
                            <div key={cat.value} className="notion-card p-4 group">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                            {cat.value === 'Food' && '🍴'}
                                            {cat.value === 'Transport' && '🚗'}
                                            {cat.value === 'Home' && '🏠'}
                                            {cat.value === 'Lifestyle' && '🎭'}
                                            {cat.value === 'Bills' && '💳'}
                                            {cat.value === 'Shopping' && '📦'}
                                            {cat.value === 'Misc' && '✨'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{cat.label}</p>
                                            <div className="flex items-center gap-1 group/input">
                                                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">
                                                    Target ₦
                                                </span>
                                                <input
                                                    type="number"
                                                    defaultValue={budget}
                                                    onBlur={(e) => {
                                                        const newVal = parseFloat(e.target.value);
                                                        if (newVal !== budget) {
                                                            updateBudget.mutate({ category: cat.value, amount: newVal });
                                                        }
                                                    }}
                                                    className="w-16 bg-transparent border-none text-[10px] font-bold text-text-secondary outline-none focus:text-text-primary focus:bg-hover px-1 rounded transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <p className={`text-lg font-bold tabular-nums ${isOver ? 'text-accent' : 'text-text-primary'}`}>
                                        ₦{spent.toFixed(2)}
                                    </p>
                                </div>
                                <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${isOver ? 'bg-accent' : 'bg-primary'}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div >
    );
}
