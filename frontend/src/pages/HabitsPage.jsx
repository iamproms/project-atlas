import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import {
    Plus,
    Trash2,
    CheckCircle,
    Star,
    Activity,
    Trophy,
    Settings,
    Clock,
    Flame
} from 'lucide-react';
import HabitHeatmap from '../components/HabitHeatmap';

export default function HabitsPage() {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const queryClient = useQueryClient();

    const { data: habits = [], isLoading } = useQuery({
        queryKey: ['habits'],
        queryFn: () => api.get('/habits/').then(res => res.data)
    });

    const createHabit = useMutation({
        mutationFn: (newHabit) => api.post('/habits/', newHabit),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
            setIsAdding(false);
            setNewName('');
            setDescription('');
        }
    });

    const deleteHabit = useMutation({
        mutationFn: (id) => api.delete(`/habits/${id}`), // Note: Need to ensure backend has DELETE /habits/{id}
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] })
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        createHabit.mutate({ name: newName, description, difficulty });
    };

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">
            <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                    <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default mb-2">
                        ⚡
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Habits</h1>
                    <p className="text-text-secondary text-sm">Systematic consistency leads to mastery.</p>
                </div>

                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-primary text-background px-6 py-2.5 rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                >
                    <Plus size={16} /> New Habit
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Create & Stats */}
                <div className="lg:col-span-4 space-y-6">
                    <section className="bg-surface/40 p-8 rounded-3xl border border-border-subtle backdrop-blur-md">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary mb-6 flex items-center gap-2">
                            <span>Initialize Protocol</span>
                        </h2>
                        {isAdding ? (
                            <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-left-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1 block">Name</label>
                                    <input
                                        className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-all shadow-inner"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g. Deep Work"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1 block">Description</label>
                                    <textarea
                                        className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-all shadow-inner min-h-[80px] resize-none"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Why this habit matters..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1 block">Difficulty</label>
                                    <div className="flex gap-2">
                                        {['easy', 'medium', 'hard'].map(d => (
                                            <button
                                                type="button"
                                                key={d}
                                                onClick={() => setDifficulty(d)}
                                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${difficulty === d
                                                        ? 'bg-primary/20 border-primary text-primary'
                                                        : 'bg-surface/50 border-border-subtle text-text-secondary hover:bg-hover'
                                                    }`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        disabled={createHabit.isPending}
                                        className="flex-1 bg-primary text-background py-3 rounded-xl text-xs font-bold hover:scale-[1.02] transition-all shadow-lg"
                                    >
                                        {createHabit.isPending ? 'Syncing...' : 'Initialize'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="px-4 py-3 border border-border-subtle rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="w-full py-4 border-2 border-dashed border-border-subtle rounded-2xl text-text-secondary hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group"
                            >
                                <div className="p-2 rounded-full bg-surface group-hover:bg-primary group-hover:text-background transition-colors">
                                    <Plus size={20} />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest">Add New Protocol</span>
                            </button>
                        )}
                    </section>

                    <section className="notion-card p-8 rounded-3xl">
                        <Trophy size={24} className="text-primary mb-4" />
                        <h3 className="text-sm font-bold text-text-primary mb-2">Power User Insight</h3>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            Users with consistent habits see a 40% increase in project completion rates over 3 months.
                        </p>
                    </section>
                </div>

                {/* Right Column: Heatmap & List */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Insights Section */}
                    <section className="bg-surface/40 p-8 rounded-3xl border border-border-subtle backdrop-blur-md">
                        <HabitHeatmap habits={habits} />
                    </section>

                    {/* Habits List */}
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary/60 mb-6 flex items-center gap-2">
                            <span>Active Protocols</span>
                            <div className="h-px flex-1 bg-border-subtle" />
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {habits.map(habit => (
                                <div key={habit.id} className="bg-surface/30 p-6 rounded-3xl border border-border-subtle hover:border-primary/30 transition-all group flex flex-col justify-between min-h-[140px]">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl bg-surface border border-border-subtle text-text-primary group-hover:scale-110 transition-transform duration-300`}>
                                                <Activity size={20} className="text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-text-primary mb-1">{habit.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${habit.difficulty === 'hard' ? 'border-accent/30 text-accent bg-accent/5' :
                                                            habit.difficulty === 'medium' ? 'border-primary/30 text-primary bg-primary/5' :
                                                                'border-text-secondary/30 text-text-secondary bg-text-secondary/5'
                                                        }`}>
                                                        {habit.difficulty}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-text-secondary mt-4 line-clamp-2">
                                        {habit.description || 'No description provided.'}
                                    </p>
                                </div>
                            ))}

                            {habits.length === 0 && !isLoading && (
                                <div className="col-span-full py-12 text-center text-text-secondary italic bg-surface/10 border border-dashed border-border-subtle rounded-3xl">
                                    No protocols defined yet.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
