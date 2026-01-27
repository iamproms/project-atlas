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
import { Wallet, TrendingUp, Calendar, ArrowRight, Plus, Info, Download, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

function TransactionHistory({ today }) {
    const { data: transactions = [] } = useQuery({
        queryKey: ['finance', 'transactions', today],
        queryFn: () => api.get(`/finance/transactions/${today}`).then(res => res.data)
    });

    const queryClient = useQueryClient();
    const deleteTx = useMutation({
        mutationFn: (id) => api.delete(`/finance/transactions/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance'] })
    });

    if (transactions.length === 0) return <p className="text-[10px] text-text-secondary italic text-center py-4">No transactions logged for today.</p>;

    return (
        <div className="space-y-1">
            {transactions.map(tx => (
                <div key={tx.id} className="group flex items-center justify-between py-2 hover:bg-hover px-3 -mx-3 rounded-xl transition-all text-sm border border-transparent hover:border-border-subtle">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-accent shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
                        <div className="flex flex-col min-w-0">
                            <span className="text-text-primary font-medium truncate">{tx.description}</span>
                            <span className="text-[9px] uppercase font-bold text-text-secondary/60 tracking-widest">{tx.category}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`font-bold tabular-nums ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-text-primary'}`}>
                            {tx.type === 'INCOME' ? '+' : ''}₦{tx.amount.toLocaleString()}
                        </span>
                        <button onClick={() => deleteTx.mutate(tx.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary hover:text-accent">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

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
    const [isAccModalOpen, setIsAccModalOpen] = useState(false);
    const [newAccName, setNewAccName] = useState('');
    const [newAccType, setNewAccType] = useState('BANK');

    // Accounts Query
    const { data: accounts = [] } = useQuery({
        queryKey: ['finance', 'accounts'],
        queryFn: () => api.get('/finance/accounts').then(res => res.data)
    });

    // Summary Query (Last Week vs This Week)
    const { data: financeSummary = {} } = useQuery({
        queryKey: ['finance', 'summary'],
        queryFn: () => api.get('/finance/summary').then(res => res.data)
    });

    const createAccount = useMutation({
        mutationFn: (newAcc) => api.post('/finance/accounts', newAcc),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'accounts'] });
            setNewAccName('');
        }
    });

    const deleteAccount = useMutation({
        mutationFn: (id) => api.delete(`/finance/accounts/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance', 'accounts'] })
    });

    // Derived stats from financeSummary
    const { this_week = { expense: 0, income: 0 }, last_week = { expense: 0, income: 0 }, net_worth = 0, categories_30d = {} } = financeSummary;

    const expenseChange = last_week.expense > 0
        ? ((this_week.expense - last_week.expense) / last_week.expense) * 100
        : 0;

    const chartData = useMemo(() => {
        return CATEGORIES.map(cat => ({
            name: cat.label,
            value: categories_30d[cat.value] || 0,
            color: cat.color
        })).filter(d => d.value > 0);
    }, [categories_30d]);

    const { theme } = useTheme();
    const axisColor = theme === 'dark' ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
    const gridColor = theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const tooltipBg = theme === 'dark' ? "#202020" : "#ffffff";
    const tooltipBorder = theme === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

    const handleDownloadCSV = () => {
        window.open(`${api.defaults.baseURL}/finance/export/csv`, '_blank');
    };

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">
            <div className="mb-12 flex items-end justify-between">
                <div>
                    <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default mb-2">
                        🏦
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Professional Finance</h1>
                    <p className="text-text-secondary text-sm">Unified ledger and cash flow management.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleDownloadCSV}
                        className="p-2.5 rounded-xl bg-surface hover:bg-hover border border-border-subtle text-text-secondary transition-all flex items-center gap-2 text-xs font-bold"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                    <div className="text-right border-l border-border-subtle pl-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Total Liquidity</p>
                        <p className="text-4xl font-bold text-primary tabular-nums">₦{net_worth.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                <div className="notion-card p-6 border-l-4 border-l-primary group">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">This Week (Spent)</p>
                    <p className="text-3xl font-bold text-text-primary tabular-nums">₦{this_week.expense.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${expenseChange > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {expenseChange > 0 ? '↑' : '↓'} {Math.abs(expenseChange).toFixed(1)}% vs last week
                        </span>
                    </div>
                </div>

                <div className="notion-card p-6 border-l-4 border-l-emerald-500">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">This Week (Income)</p>
                    <p className="text-3xl font-bold text-text-primary tabular-nums">₦{this_week.income.toLocaleString()}</p>
                    <p className="mt-4 text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                        Net: <span className={this_week.income >= this_week.expense ? 'text-emerald-500' : 'text-red-500'}>
                            ₦{(this_week.income - this_week.expense).toLocaleString()}
                        </span>
                    </p>
                </div>

                <div className="notion-card p-6 border-l-4 border-l-text-secondary/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Last Week (Spent)</p>
                    <div className="flex items-end justify-between">
                        <p className="text-3xl font-bold text-text-primary/60 tabular-nums">₦{last_week.expense.toLocaleString()}</p>
                        <TrendingUp size={20} className="text-text-secondary/20" />
                    </div>
                </div>

                <div className="notion-card p-6 border-l-4 border-l-accent flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Active Accounts</p>
                        <div className="flex -space-x-2 mt-2">
                            {accounts.map(acc => (
                                <div key={acc.id} className="w-8 h-8 rounded-full bg-surface border-2 border-background flex items-center justify-center text-xs shadow-sm" title={acc.name}>
                                    {acc.type === 'CASH' ? '💵' : acc.type === 'SAVINGS' ? '🏦' : '💳'}
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAccModalOpen(true)}
                        className="mt-4 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline text-left"
                    >
                        Manage Accounts →
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Analytics */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="notion-card p-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-8">Category Allocation (30 Days)</h3>
                        {chartData.length > 0 ? (
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" stroke={axisColor} fontSize={10} width={80} />
                                        <Tooltip
                                            cursor={{ fill: gridColor }}
                                            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '4px' }}
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
                            <div className="h-64 flex items-center justify-center text-sm text-text-secondary italic">
                                No spending records found for categories.
                            </div>
                        )}
                    </div>

                    <div className="notion-card p-8" id="activity">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-8 flex items-center justify-between">
                            <span>Recent Activity</span>
                            <button
                                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                                className="text-[10px] text-primary hover:underline bg-transparent border-none cursor-pointer"
                            >
                                Jump to end ↓
                            </button>
                        </h3>
                        <div className="space-y-1">
                            <TransactionHistory today={format(today, 'yyyy-MM-dd')} />
                        </div>
                    </div>
                </div>

                {/* Account Balances Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <section className="bg-surface/30 p-8 rounded-3xl border border-border-subtle backdrop-blur-md">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6 flex items-center justify-between">
                            <span>Accounts</span>
                            <Plus size={14} className="cursor-pointer hover:text-primary transition-colors" />
                        </h2>
                        <div className="space-y-4">
                            {accounts.map(acc => (
                                <div key={acc.id} className="flex items-center justify-between p-4 rounded-xl bg-surface/50 border border-transparent hover:border-primary/20 transition-all group">
                                    <div className="flex items-center gap-3 font-semibold">
                                        <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center text-2xl shadow-inner border border-border-subtle relative">
                                            {acc.type === 'CASH' ? '💵' : acc.type === 'SAVINGS' ? '🏦' : '💳'}
                                            {acc.is_default && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-surface flex items-center justify-center" title="Primary Account">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary flex items-center gap-2">
                                                {acc.name}
                                                {acc.is_default && <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Primary</span>}
                                            </p>
                                            <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest opacity-60">{acc.type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold tabular-nums text-lg">₦{acc.balance.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="notion-card p-8 bg-gradient-to-br from-primary/5 to-transparent">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4 flex items-center gap-2">
                            <Info size={14} /> Financial Tip
                        </h3>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            Your savings increased by <span className="text-emerald-500 font-bold">₦{this_week.income.toLocaleString()}</span> this week. Keeping 3-6 months of expenses in your "Savings" account is a professional benchmark.
                        </p>
                    </section>
                </div>
            </div>

            {/* Account Management Modal */}
            {isAccModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
                    <div className="bg-surface w-full max-w-md rounded-[2.5rem] border border-border-subtle shadow-2xl p-10 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-2xl font-bold tracking-tight">Manage Accounts</h2>
                            <button onClick={() => setIsAccModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-hover text-text-secondary hover:text-text-primary transition-all text-2xl">×</button>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/60">Current Accounts</p>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {accounts.map(acc => (
                                        <div key={acc.id} className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-border-subtle group hover:border-primary/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-xl shadow-sm border border-border-subtle">
                                                    {acc.type === 'CASH' ? '💵' : acc.type === 'SAVINGS' ? '🏦' : '💳'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-text-primary">{acc.name}</span>
                                                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">{acc.type}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-bold tabular-nums">₦{acc.balance.toLocaleString()}</span>
                                                {!acc.is_default && (
                                                    <button onClick={() => {
                                                        if (window.confirm('Delete this account? (Must have no transactions)')) {
                                                            deleteAccount.mutate(acc.id);
                                                        }
                                                    }} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary hover:text-accent p-1">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (!newAccName) return;
                                createAccount.mutate({ name: newAccName, type: newAccType, balance: 0.0 });
                            }} className="space-y-6 pt-6 border-t border-border-subtle">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/60">Connect New Account</p>
                                    <input
                                        className="w-full bg-background border border-border-subtle rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
                                        placeholder="Account Name (e.g. Zenith Opay)"
                                        value={newAccName}
                                        onChange={(e) => setNewAccName(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {['BANK', 'CASH', 'SAVINGS', 'CARD'].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setNewAccType(t)}
                                            className={`py-3 rounded-xl text-[9px] font-bold border-2 transition-all shadow-sm ${newAccType === t ? 'bg-primary border-primary text-white scale-105 shadow-primary/20' : 'bg-surface border-border-subtle text-text-secondary hover:border-text-secondary/30'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4">
                                    Add Account
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
