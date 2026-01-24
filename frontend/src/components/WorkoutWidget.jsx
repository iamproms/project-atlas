import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import {
    Dumbbell,
    Plus,
    Trash2,
    History,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    MoreVertical
} from 'lucide-react';

export default function WorkoutWidget({ dateStr }) {
    const [isAdding, setIsAdding] = useState(false);
    const [workoutType, setWorkoutType] = useState('Full Body');
    const [exercises, setExercises] = useState([{ exercise_name: '', weight: '', reps: '', order: 0 }]);
    const [lastSets, setLastSets] = useState({}); // Hinting storage

    const queryClient = useQueryClient();

    const { data: workouts = [] } = useQuery({
        queryKey: ['workouts', dateStr],
        queryFn: () => api.get(`/workouts/${dateStr}`).then(res => res.data)
    });

    const createWorkout = useMutation({
        mutationFn: (newWorkout) => api.post('/workouts/', newWorkout),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workouts', dateStr] });
            setIsAdding(false);
            setExercises([{ exercise_name: '', weight: '', reps: '', order: 0 }]);
        }
    });

    const deleteWorkout = useMutation({
        mutationFn: (id) => api.delete(`/workouts/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts', dateStr] })
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

        if (field === 'exercise_name' && value.length > 2) {
            fetchLastSet(value, index);
        }
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
        <section className="animate-in fade-in duration-500">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary/60 mb-6 flex items-center gap-2">
                <span>Workouts</span>
                <div className="h-px flex-1 bg-border-subtle" />
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-1 hover:bg-hover rounded transition-colors text-text-primary"
                >
                    <Plus size={14} />
                </button>
            </h2>

            <div className="space-y-6">
                {/* List of Workouts */}
                {workouts.map(workout => (
                    <div key={workout.id} className="notion-card overflow-hidden">
                        <div className="p-4 border-b border-border-subtle bg-surface/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded bg-accent/10 text-accent">
                                    <Dumbbell size={16} />
                                </div>
                                <h3 className="font-bold text-sm text-text-primary">{workout.type}</h3>
                            </div>
                            <button
                                onClick={() => deleteWorkout.mutate(workout.id)}
                                className="p-1.5 text-text-secondary hover:text-accent transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            {workout.sets.map((set, i) => (
                                <div key={set.id} className="flex items-center justify-between text-sm">
                                    <span className="text-text-primary font-medium">{set.exercise_name}</span>
                                    <div className="flex items-center gap-4 tabular-nums text-text-secondary">
                                        <span className="flex items-center gap-1">
                                            <span className="text-text-primary font-bold">{set.weight}kg</span>
                                        </span>
                                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-30">x</span>
                                        <span className="flex items-center gap-1">
                                            <span className="text-text-primary font-bold">{set.reps}</span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {workout.notes && (
                                <p className="text-xs text-text-secondary italic pt-2 border-t border-border-subtle mt-2">
                                    {workout.notes}
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {isAdding && (
                    <form onSubmit={handleSubmit} className="bg-surface/30 p-4 rounded-xl border border-border-subtle space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-4">
                            <input
                                className="flex-1 bg-transparent border-b border-border-subtle py-2 text-lg font-bold text-text-primary outline-none focus:border-primary transition-colors"
                                placeholder="Workout Name (e.g. Leg Day)"
                                value={workoutType}
                                onChange={(e) => setWorkoutType(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            {exercises.map((ex, index) => (
                                <div key={index} className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2 transition-all">
                                    <div className="flex-1 space-y-1">
                                        <input
                                            className="w-full notion-input text-sm"
                                            placeholder="Exercise"
                                            value={ex.exercise_name}
                                            onChange={(e) => updateExercise(index, 'exercise_name', e.target.value)}
                                        />
                                        {lastSets[index] && (
                                            <p className="text-[9px] text-primary flex items-center gap-1 px-1">
                                                <History size={10} />
                                                Last: {lastSets[index].weight}kg x {lastSets[index].reps}
                                                <TrendingUp size={10} className="ml-1" />
                                            </p>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        className="w-16 notion-input text-sm text-center"
                                        placeholder="kg"
                                        value={ex.weight}
                                        onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        className="w-16 notion-input text-sm text-center"
                                        placeholder="reps"
                                        value={ex.reps}
                                        onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeExerciseRow(index)}
                                        className="p-2 text-text-secondary hover:text-accent"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addExerciseRow}
                                className="w-full py-2 border border-dashed border-border-subtle rounded-lg text-[10px] uppercase font-bold tracking-widest text-text-secondary hover:text-text-primary hover:border-text-secondary transition-all"
                            >
                                <Plus size={12} className="inline mr-1" /> Add Exercise
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="text-xs font-semibold text-text-secondary hover:text-text-primary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createWorkout.isPending}
                                className="px-6 py-2 bg-primary text-background rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-lg"
                            >
                                {createWorkout.isPending ? 'Saving...' : 'Finish Workout'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
}
