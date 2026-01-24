import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, startOfDay } from 'date-fns';
import api from '../api/client';
import {
    Dumbbell,
    Plus,
    Trash2,
    History,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Calendar,
    Activity,
    Target
} from 'lucide-react';

export default function FitnessPage() {
    const today = startOfDay(new Date());
    const dateStr = format(today, 'yyyy-MM-dd');
    const [isAdding, setIsAdding] = useState(false);
    const [workoutType, setWorkoutType] = useState('Full Body');
    const [exercises, setExercises] = useState([{ exercise_name: '', weight: '', reps: '', order: 0 }]);
    const [lastSets, setLastSets] = useState({});

    const queryClient = useQueryClient();

    // In a real app, this would be a full history endpoint
    const { data: workouts = [] } = useQuery({
        queryKey: ['workouts', 'history'],
        queryFn: () => api.get('/workouts/stats/range', {
            params: {
                start_date: format(subDays(today, 30), 'yyyy-MM-dd'),
                end_date: format(today, 'yyyy-MM-dd')
            }
        }).then(res => res.data)
    });

    const createWorkout = useMutation({
        mutationFn: (newWorkout) => api.post('/workouts/', newWorkout),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workouts', 'history'] });
            setIsAdding(false);
            setExercises([{ exercise_name: '', weight: '', reps: '', order: 0 }]);
        }
    });

    const deleteWorkout = useMutation({
        mutationFn: (id) => api.delete(`/workouts/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] })
    });

    const fetchLastSet = async (name, index) => {
        if (!name) return;
        try {
            const res = await api.get(`/workouts/exercises/last/${encodeURIComponent(name)}`);
            if (res.data) {
                setLastSets(prev => ({ ...prev, [index]: res.data }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const addExerciseRow = () => {
        setExercises([...exercises, { exercise_name: '', weight: '', reps: '', order: exercises.length }]);
    };

    const updateExercise = (index, field, value) => {
        const newEx = [...exercises];
        newEx[index][field] = value;
        setExercises(newEx);
        if (field === 'exercise_name' && value.length > 2) fetchLastSet(value, index);
    };

    const removeExerciseRow = (index) => {
        setExercises(exercises.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validExercises = exercises.filter(ex =>
            ex.exercise_name?.trim() &&
            ex.weight !== '' && !isNaN(parseFloat(ex.weight)) &&
            ex.reps !== '' && !isNaN(parseInt(ex.reps))
        );

        if (validExercises.length === 0) {
            alert("Please provide at least one exercise with valid weight and reps.");
            return;
        }

        createWorkout.mutate({
            date: dateStr,
            type: workoutType,
            sets: validExercises.map((ex, i) => ({
                exercise_name: ex.exercise_name,
                weight: parseFloat(ex.weight),
                reps: parseInt(ex.reps),
                order: i
            }))
        });
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-24">
            <div className="mb-12 flex justify-between items-end">
                <div>
                    <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default mb-2">
                        💪
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Fitness</h1>
                    <p className="text-text-secondary text-sm">Physical capability and progressive overload.</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-primary text-background px-6 py-2 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-all"
                    >
                        Log Workout
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    {isAdding && (
                        <div className="bg-surface/30 p-8 rounded-3xl border border-primary/20 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-text-primary">New Session</h3>
                                <button onClick={() => setIsAdding(false)} className="text-text-secondary hover:text-text-primary text-sm font-bold">Discard</button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <input
                                    className="w-full bg-transparent border-b border-border-subtle py-4 text-3xl font-bold text-text-primary outline-none focus:border-primary transition-all placeholder:text-text-secondary/10"
                                    placeholder="Workout Title (e.g. Push B)"
                                    value={workoutType}
                                    onChange={(e) => setWorkoutType(e.target.value)}
                                    autoFocus
                                />

                                <div className="space-y-4">
                                    {exercises.map((ex, index) => (
                                        <div key={index} className="flex gap-4 items-start p-4 bg-surface rounded-2xl border border-border-subtle group">
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    className="w-full bg-transparent text-lg font-medium text-text-primary outline-none"
                                                    placeholder="Exercise Name"
                                                    value={ex.exercise_name}
                                                    onChange={(e) => updateExercise(index, 'exercise_name', e.target.value)}
                                                />
                                                {lastSets[index] && (
                                                    <div className="flex items-center gap-2 text-[10px] text-primary uppercase font-bold tracking-widest">
                                                        <History size={12} />
                                                        Last: {lastSets[index].weight}kg × {lastSets[index].reps}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                    <input
                                                        type="number"
                                                        className="w-16 bg-surface-subtle text-center text-lg font-bold text-text-primary rounded-lg py-2 outline-none focus:bg-primary/10"
                                                        placeholder="0"
                                                        value={ex.weight}
                                                        onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                                                    />
                                                    <span className="block text-[8px] uppercase font-bold text-text-secondary mt-1">Weight</span>
                                                </div>
                                                <span className="text-text-secondary/20 pb-4">×</span>
                                                <div className="text-right">
                                                    <input
                                                        type="number"
                                                        className="w-16 bg-surface-subtle text-center text-lg font-bold text-text-primary rounded-lg py-2 outline-none focus:bg-primary/10"
                                                        placeholder="0"
                                                        value={ex.reps}
                                                        onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                                                    />
                                                    <span className="block text-[8px] uppercase font-bold text-text-secondary mt-1">Reps</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeExerciseRow(index)}
                                                className="p-2 text-text-secondary hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addExerciseRow}
                                        className="w-full py-4 border-2 border-dashed border-border-subtle rounded-2xl text-[10px] uppercase font-bold tracking-[0.2em] text-text-secondary hover:text-text-primary hover:border-text-secondary transition-all"
                                    >
                                        <Plus size={16} className="inline mr-2" /> Add Next Exercise
                                    </button>
                                </div>

                                <div className="flex justify-end pt-8">
                                    <button
                                        type="submit"
                                        disabled={createWorkout.isPending}
                                        className="bg-primary text-background px-12 py-3 rounded-2xl text-sm font-bold shadow-xl hover:scale-105 active:scale-95 transition-all"
                                    >
                                        {createWorkout.isPending ? 'Logging...' : 'Finish Workout'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="space-y-6">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary/60 flex items-center gap-2">
                            <span>Recent History</span>
                            <div className="h-px flex-1 bg-border-subtle" />
                        </h2>

                        {workouts.map(workout => (
                            <div key={workout.id} className="notion-card overflow-hidden animate-in fade-in duration-500">
                                <div className="p-6 bg-surface/20 border-b border-border-subtle flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-primary text-xl">{workout.type}</h3>
                                            <p className="text-xs text-text-secondary flex items-center gap-2">
                                                <Calendar size={12} /> {format(new Date(workout.created_at), 'MMMM d, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteWorkout.mutate(workout.id)} className="p-2 text-text-secondary hover:text-accent transition-colors"><Trash2 size={18} /></button>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                                        {workout.sets.map((set, i) => (
                                            <div key={set.id} className="flex items-center justify-between border-b border-border-subtle/30 pb-2">
                                                <span className="font-medium text-text-primary">{set.exercise_name}</span>
                                                <div className="flex items-center gap-4 tabular-nums">
                                                    <span className="text-text-secondary"><span className="text-text-primary font-bold">{set.weight}</span>kg</span>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-20 text-text-secondary">×</span>
                                                    <span className="text-text-secondary"><span className="text-text-primary font-bold">{set.reps}</span></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {workouts.length === 0 && !isAdding && (
                            <div className="py-20 text-center text-text-secondary italic bg-surface/10 rounded-3xl border-2 border-dashed border-border-subtle">
                                Your fitness journey begins with the first rep.
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <section className="notion-card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp size={24} className="text-primary" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary">Progress Insights</h3>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-text-secondary mb-1">Consistency</p>
                                <p className="text-2xl font-bold text-text-primary">85% <span className="text-xs text-primary">+5% this week</span></p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-text-secondary mb-1">Total Volume</p>
                                <p className="text-2xl font-bold text-text-primary">12.5k kg <span className="text-xs text-text-secondary">active today</span></p>
                            </div>
                        </div>
                    </section>

                    <section className="notion-card p-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6 flex items-center gap-2">
                            <Target size={14} />
                            <span>Goals</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Bench Press 100kg</span>
                                <span className="text-[10px] font-bold text-primary">80%</span>
                            </div>
                            <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: '80%' }} />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
