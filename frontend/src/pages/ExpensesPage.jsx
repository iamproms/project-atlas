import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import api from '../api/client';
import {
    TrendingDown,
    TrendingUp,
    Plus,
    Download,
    Trash2,
    Info,
    Calendar,
    Settings,
    MoreHorizontal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

function TransactionHistory({ today, ledger = [] }) {
    const queryClient = useQueryClient();
    const deleteEntry = useMutation({
        mutationFn: (id) => api.delete(`/finance/ledger/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance'] })
    });

    return (
        <div className="space-y-4">
            {ledger.length === 0 ? (
                <div className="text-center py-12 text-text-secondary italic text-sm">No ledger entries for this period.</div>
            ) : (
                ledger.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface/50 border border-transparent hover:border-border-subtle transition-all group">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${entry.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                {entry.type === 'INCOME' ? '📈' : '📉'}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-primary">{entry.description}</p>
                                <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">{format(new Date(entry.date), 'MMM dd, yyyy')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <p className={`font-bold tabular-nums ${entry.type === 'INCOME' ? 'text-emerald-500' : 'text-text-primary'}`}>
                                {entry.type === 'INCOME' ? '+' : '-'}₦{(entry.amount_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <button
                                onClick={() => {
                                    if (window.confirm('Archive this entry? Account balance will be reverted.')) {
                                        deleteEntry.mutate(entry.id);
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
    const today = new Date();
    const queryClient = useQueryClient();
    const [isAccModalOpen, setIsAccModalOpen] = useState(false);
    const [newAccName, setNewAccName] = useState('');
    const [newAccType, setNewAccType] = useState('BANK');

    // Queries
    const { data: accounts = [] } = useQuery({
        queryKey: ['finance', 'accounts'],
        queryFn: () => api.get('/finance/accounts').then(res => res.data)
    });

    const { data: summary = { this_month: { income: 0, expenses: 0, net: 0 }, net_worth: 0 } } = useQuery({
        queryKey: ['finance', 'summary'],
        queryFn: () => api.get('/finance/summary').then(res => res.data)
    });

    const { data: ledger = [] } = useQuery({
        queryKey: ['finance', 'ledger', 'monthly'],
        queryFn: () => api.get('/finance/ledger', { params: { month: today.getMonth() + 1, year: today.getFullYear() } }).then(res => res.data)
    });

    // Mutations
    const createAccount = useMutation({
        mutationFn: (newAcc) => api.post('/finance/accounts', newAcc),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'accounts'] });
            setNewAccName('');
            setIsAccModalOpen(false);
        }
    });

    const deleteAccount = useMutation({
        mutationFn: (id) => api.delete(`/finance/accounts/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance', 'accounts'] })
    });

    const handleDownloadCSV = () => {
        window.open(`${api.defaults.baseURL}/finance/export/csv`, '_blank');
    };

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">
            <div className="mb-12 flex items-end justify-between">
                <div>
                    <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default mb-2">
                        ⚖️
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Financial Ledger</h1>
                    <p className="text-text-secondary text-sm italic">"Professional integrity over numbers."</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleDownloadCSV}
                        className="p-2.5 rounded-xl bg-surface hover:bg-hover border border-border-subtle text-text-secondary transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                    <div className="text-right border-l border-border-subtle pl-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1 opacity-50">Total Liquidity</p>
                        <p className="text-4xl font-bold text-primary tabular-nums">₦{(summary.net_worth / 100).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                <div className="notion-card p-8 border-l-4 border-l-primary flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-4 opacity-50">Monthly Outflow</p>
                        <p className="text-4xl font-bold text-text-primary tabular-nums">₦{(summary.this_month.expenses / 100).toLocaleString()}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-text-secondary font-medium">
                        <TrendingDown size={14} className="text-accent" />
                        Allocated across {new Set(ledger.filter(e => e.type === 'EXPENSE').map(e => e.category_id)).size} categories
                    </div>
                </div>

                <div className="notion-card p-8 border-l-4 border-l-emerald-500 flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-4 opacity-50">Monthly Inflow</p>
                        <p className="text-4xl font-bold text-text-primary tabular-nums">₦{(summary.this_month.income / 100).toLocaleString()}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-text-secondary font-medium text-emerald-500">
                        <TrendingUp size={14} />
                        +{((summary.this_month.net / (summary.this_month.expenses || 1)) * 100).toFixed(1)}% safe margin
                    </div>
                </div>

                <div className="notion-card p-8 border-l-4 border-l-accent flex flex-col justify-between group">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary opacity-50">Connected Vaults</p>
                            <Settings size={14} className="text-text-secondary/20 group-hover:text-text-secondary transition-all cursor-pointer" onClick={() => setIsAccModalOpen(true)} />
                        </div>
                        <div className="flex -space-x-3 mt-2 overflow-hidden">
                            {accounts.map(acc => (
                                <div key={acc.id} className="w-10 h-10 rounded-2xl bg-surface border-2 border-background flex items-center justify-center text-xl shadow-lg hover:-translate-y-1 transition-all cursor-default" title={acc.name}>
                                    {acc.type === 'CASH' ? '💵' : acc.type === 'SAVINGS' ? '🏦' : '💳'}
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAccModalOpen(true)}
                        className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-primary hover:underline text-left"
                    >
                        Audit Accounts →
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <div className="notion-card p-10">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight">Active Ledger</h3>
                                <p className="text-xs text-text-secondary mt-1">Detailed history of all verified entries for {format(today, 'MMMM yyyy')}</p>
                            </div>
                            <button className="p-2 border border-border-subtle rounded-xl text-text-secondary hover:bg-hover">
                                <Calendar size={16} />
                            </button>
                        </div>
                        <TransactionHistory ledger={ledger} />
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <section className="bg-surface/30 p-8 rounded-3xl border border-border-subtle backdrop-blur-md">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary/50 mb-8">Vault Status</h2>
                        <div className="space-y-4">
                            {accounts.map(acc => (
                                <div key={acc.id} className="flex items-center justify-between p-5 rounded-2xl bg-surface/50 border border-transparent hover:border-primary/20 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-2xl shadow-inner border border-border-subtle relative">
                                            {acc.type === 'CASH' ? '💵' : acc.type === 'SAVINGS' ? '🏦' : '💳'}
                                            {acc.is_default && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-surface flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">{acc.name}</p>
                                            <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest opacity-60">{acc.type}</p>
                                        </div>
                                    </div>
                                    <p className="font-bold tabular-nums text-lg">₦{(acc.balance_cents / 100).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="notion-card p-10 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6 flex items-center gap-2">
                            <Info size={14} className="text-primary" /> System Guarantee
                        </h3>
                        <p className="text-xs text-text-secondary leading-relaxed font-medium">
                            Atlas uses integer-based currency tracking for professional-grade data integrity. All monetary values are verified subunits (cents/kobo) preventing floating-point drift across years of tracking.
                        </p>
                    </section>
                </div>
            </div>

            {/* Account Modal */}
            {isAccModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-left">
                    <div className="bg-surface w-full max-w-md rounded-[2.5rem] border border-border-subtle shadow-2xl p-12 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-3xl font-bold tracking-tighter">Manage Vaults</h2>
                            <button onClick={() => setIsAccModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-hover text-text-secondary transition-all text-2xl">×</button>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/40">Active Connections</p>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {accounts.map(acc => (
                                        <div key={acc.id} className="flex items-center justify-between p-5 rounded-[2rem] bg-background/50 border border-border-subtle group hover:border-primary/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-surface flex items-center justify-center text-xl shadow-sm border border-border-subtle">
                                                    {acc.type === 'CASH' ? '💵' : acc.type === 'SAVINGS' ? '🏦' : '💳'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-text-primary">{acc.name}</span>
                                                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">{acc.type}</span>
                                                </div>
                                            </div>
                                            {!acc.is_default && (
                                                <button onClick={() => deleteAccount.mutate(acc.id)} className="opacity-0 group-hover:opacity-100 p-2 text-accent"><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (!newAccName) return;
                                createAccount.mutate({ name: newAccName, type: newAccType, balance_cents: 0 });
                            }} className="space-y-8 pt-8 border-t border-border-subtle">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/40">Add New Vault</p>
                                    <input
                                        className="w-full bg-background border border-border-subtle rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                        placeholder="Vault Name (e.g. Opay Wallet)"
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
                                            className={`py-4 rounded-2xl text-[9px] font-extrabold border-2 transition-all ${newAccType === t ? 'bg-primary border-primary text-white scale-105' : 'bg-surface border-border-subtle text-text-secondary'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                <button type="submit" className="w-full py-5 bg-primary text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    Initialize Vault
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
