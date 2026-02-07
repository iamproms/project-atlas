import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, startOfDay, getDay, startOfYear, eachDayOfInterval, isSameDay } from 'date-fns';
import api from '../api/client';
import {
    Dumbbell,
    Plus,
    Trash2,
    History,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Calendar as CalendarIcon,
    Activity,
    Target,
    Trophy,
    Flame
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ROUTINE_TEMPLATES = {
    'Push Day': [
        { exercise_name: 'Bench Press', weight: '', reps: '', order: 0 },
        { exercise_name: 'Overhead Press', weight: '', reps: '', order: 1 },
        { exercise_name: 'Incline Dumbbell Press', weight: '', reps: '', order: 2 },
        { exercise_name: 'Tricep Pushdowns', weight: '', reps: '', order: 3 }
    ],
    'Pull Day': [
        { exercise_name: 'Deadlift', weight: '', reps: '', order: 0 },
        { exercise_name: 'Pull ups', weight: '', reps: '', order: 1 },
        { exercise_name: 'Barbell Row', weight: '', reps: '', order: 2 },
        { exercise_name: 'Face Pulls', weight: '', reps: '', order: 3 }
    ],
    'Leg Day': [
        { exercise_name: 'Squat', weight: '', reps: '', order: 0 },
        { exercise_name: 'Romanian Deadlift', weight: '', reps: '', order: 1 },
        { exercise_name: 'Leg Press', weight: '', reps: '', order: 2 },
        { exercise_name: 'Calf Raises', weight: '', reps: '', order: 3 }
    ],
    'Full Body': [
        { exercise_name: 'Squat', weight: '', reps: '', order: 0 },
        { exercise_name: 'Bench Press', weight: '', reps: '', order: 1 },
        { exercise_name: 'Deadlift', weight: '', reps: '', order: 2 },
        { exercise_name: 'Overhead Press', weight: '', reps: '', order: 3 }
    ]
};

const CALISTHENICS_TEMPLATES = {
    'Full Body BW': [
        { exercise_name: 'Pushups', weight: 0, reps: '', order: 0 },
        { exercise_name: 'Bodyweight Squats', weight: 0, reps: '', order: 1 },
        { exercise_name: 'Lunges', weight: 0, reps: '', order: 2 },
        { exercise_name: 'Plank (Secs)', weight: 0, reps: '', order: 3 },
        { exercise_name: 'Mountain Climbers', weight: 0, reps: '', order: 4 }
    ],
    'Core Blast': [
        { exercise_name: 'Crunches', weight: 0, reps: '', order: 0 },
        { exercise_name: 'Leg Raises', weight: 0, reps: '', order: 1 },
        { exercise_name: 'Plank (Secs)', weight: 0, reps: '', order: 2 },
        { exercise_name: 'Russian Twists', weight: 0, reps: '', order: 3 }
    ],
    'HIIT Home': [
        { exercise_name: 'Burpees', weight: 0, reps: '', order: 0 },
        { exercise_name: 'Jump Squats', weight: 0, reps: '', order: 1 },
        { exercise_name: 'High Knees', weight: 0, reps: '', order: 2 },
        { exercise_name: 'Pushups', weight: 0, reps: '', order: 3 }
    ]
};

export default function FitnessPage() {
    const today = startOfDay(new Date());
    const dateStr = format(today, 'yyyy-MM-dd');
    const [isAdding, setIsAdding] = useState(false);
    const [workoutType, setWorkoutType] = useState('');
    const [exercises, setExercises] = useState([]);
    const [lastSets, setLastSets] = useState({});

    const queryClient = useQueryClient();

    // Queries
    const { data: workouts = [] } = useQuery({
        queryKey: ['workouts', 'history'],
        queryFn: () => api.get('/workouts/stats/range', {
            params: {
                start_date: format(subDays(today, 60), 'yyyy-MM-dd'),
                end_date: format(today, 'yyyy-MM-dd')
            }
        }).then(res => res.data)
    });

    const { data: heatmap = [] } = useQuery({
        queryKey: ['workouts', 'heatmap'],
        queryFn: () => api.get('/workouts/stats/heatmap').then(res => res.data)
    });

    const { data: prs = [] } = useQuery({
        queryKey: ['workouts', 'prs'],
        queryFn: () => api.get('/workouts/stats/prs').then(res => res.data)
    });

    // Mutations
    const createWorkout = useMutation({
        mutationFn: (newWorkout) => api.post('/workouts/', newWorkout),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workouts'] });
            setIsAdding(false);
            setExercises([]);
            setWorkoutType('');
        }
    });

    const deleteWorkout = useMutation({
        mutationFn: (id) => api.delete(`/workouts/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workouts'] })
    });

    // Helpers
    const loadTemplate = (source, name) => {
        setWorkoutType(name);
        setExercises(source[name]);
        setIsAdding(true);
    };

    const updateExercise = (index, field, value) => {
        const newEx = [...exercises];
        newEx[index][field] = value;
        setExercises(newEx);
    };

    const addExerciseRow = () => {
        setExercises([...exercises, { exercise_name: '', weight: '', reps: '', order: exercises.length }]);
    };

    const removeExerciseRow = (index) => {
        setExercises(exercises.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validExercises = exercises.filter(ex => ex.exercise_name?.trim());
        if (validExercises.length === 0) return;

        createWorkout.mutate({
            date: dateStr,
            type: workoutType || 'Custom Workout',
            sets: validExercises.map((ex, i) => ({
                exercise_name: ex.exercise_name,
                weight: parseFloat(ex.weight) || 0,
                reps: parseInt(ex.reps) || 0,
                order: i
            }))
        });
    };

    return (
        <div className="max-w-6xl mx-auto px-6 py-8 md:py-12">
            {/* Header / Heatmap Section */}
            <div className="mb-12">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                            The Iron Ledger <Dumbbell className="text-primary" />
                        </h1>
                        <p className="text-text-secondary text-sm">Consistency is the only magic pill.</p>
                    </div>
                    {!isAdding && (
                        <div className="flex flex-col gap-4 items-end">
                            <div className="flex gap-2 flex-wrap justify-end">
                                <span className="text-[10px] uppercase font-bold text-text-secondary self-center mr-2">Gym</span>
                                {Object.keys(ROUTINE_TEMPLATES).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => loadTemplate(ROUTINE_TEMPLATES, type)}
                                        className="px-3 py-1.5 rounded-lg bg-surface border border-white/5 text-xs font-bold text-text-secondary hover:text-primary hover:border-primary/30 transition-all"
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end">
                                <span className="text-[10px] uppercase font-bold text-text-secondary self-center mr-2">Home</span>
                                {Object.keys(CALISTHENICS_TEMPLATES).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => loadTemplate(CALISTHENICS_TEMPLATES, type)}
                                        className="px-3 py-1.5 rounded-lg bg-surface border border-white/5 text-xs font-bold text-text-secondary hover:text-emerald-400 hover:border-emerald-400/30 transition-all"
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => { setIsAdding(true); setWorkoutType(''); setExercises([{ exercise_name: '', weight: '', reps: '', order: 0 }]); }}
                                className="bg-primary text-background px-6 py-2 rounded-xl text-sm font-bold shadow-lg hover:brightness-110 transition-all"
                            >
                                Log Custom
                            </button>
                        </div>
                    )}
                </div>

                <ActivityHeatmap data={heatmap} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Logger or History */}
                <div className="lg:col-span-2 space-y-8">
                    {isAdding ? (
                        <div className="bg-surface border border-white/5 rounded-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Log Session</h2>
                                <button onClick={() => setIsAdding(false)} className="text-xs font-bold text-text-secondary hover:text-red-400">CANCEL</button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <input
                                    className="w-full bg-transparent text-2xl font-bold placeholder:text-text-secondary/20 border-b border-white/10 pb-2 focus:border-primary focus:outline-none transition-colors"
                                    placeholder="Workout Name (e.g. Leg Day)"
                                    value={workoutType}
                                    onChange={(e) => setWorkoutType(e.target.value)}
                                    autoFocus
                                />
                                <div className="space-y-3">
                                    {exercises.map((ex, i) => (
                                        <div key={i} className="flex gap-3 items-center group">
                                            <input
                                                className="flex-1 bg-white/5 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-secondary/30"
                                                placeholder="Exercise Name"
                                                value={ex.exercise_name}
                                                onChange={(e) => updateExercise(i, 'exercise_name', e.target.value)}
                                            />
                                            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-3">
                                                <input
                                                    type="number"
                                                    className="w-16 bg-transparent text-center font-bold outline-none"
                                                    placeholder="kg"
                                                    value={ex.weight}
                                                    onChange={(e) => updateExercise(i, 'weight', e.target.value)}
                                                />
                                                <span className="text-text-secondary/20">×</span>
                                                <input
                                                    type="number"
                                                    className="w-12 bg-transparent text-center font-bold outline-none"
                                                    placeholder="reps"
                                                    value={ex.reps}
                                                    onChange={(e) => updateExercise(i, 'reps', e.target.value)}
                                                />
                                            </div>
                                            <button type="button" onClick={() => removeExerciseRow(i)} className="p-2 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addExerciseRow} className="w-full py-3 border border-dashed border-white/10 rounded-lg text-xs font-bold text-text-secondary hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2">
                                        <Plus size={14} /> ADD EXERCISE
                                    </button>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button type="submit" className="bg-primary text-background px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all">
                                        Complete Workout
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2 mb-4">
                                <History size={14} /> Recent Log
                            </h3>
                            {workouts.map(workout => (
                                <div key={workout.id} className="bg-surface border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-text-primary">{workout.type}</h4>
                                            <p className="text-xs text-text-secondary">{format(new Date(workout.date), 'EEEE, MMMM do')}</p>
                                        </div>
                                        <button onClick={() => deleteWorkout.mutate(workout.id)} className="text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-8">
                                        {workout.sets.map(set => (
                                            <div key={set.id} className="flex justify-between text-sm border-b border-white/5 pb-1 last:border-0 last:pb-0">
                                                <span className="text-text-secondary">{set.exercise_name}</span>
                                                <span className="font-mono font-bold text-text-primary">
                                                    {set.weight > 0 ? set.weight : 'BW'}
                                                    {set.weight > 0 && <span className="text-xs text-text-secondary font-sans ml-0.5">kg</span>}
                                                    <span className="text-xs text-text-secondary mx-2">×</span>
                                                    {set.reps}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {workouts.length === 0 && (
                                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-text-secondary">
                                    No recent workouts. Time to lift heavy stones! 🗿
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar: PRs and Stats */}
                <div className="space-y-6">
                    <div className="bg-surface border border-white/5 rounded-2xl p-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2 mb-6">
                            <Trophy size={14} className="text-yellow-500" /> Personal Records
                        </h3>
                        <div className="space-y-4">
                            {prs.map((pr, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-text-secondary">{pr.exercise}</span>
                                    <span className="text-lg font-bold text-text-primary">{pr.weight}<span className="text-xs text-text-secondary ml-1">kg</span></span>
                                </div>
                            ))}
                            {prs.length === 0 && <div className="text-xs text-text-secondary italic">Log workouts to see your maxes here.</div>}
                        </div>
                    </div>

                    <div className="bg-surface border border-white/5 rounded-2xl p-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2 mb-6">
                            <Flame size={14} className="text-orange-500" /> Weekly Intensity
                        </h3>
                        <div className="h-[150px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={workouts.slice(0, 7).reverse()}>
                                    <defs>
                                        <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D4FF00" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#D4FF00" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                    <Area type="monotone" dataKey="sets.length" stroke="#D4FF00" fillOpacity={1} fill="url(#colorIntensity)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-center text-xs text-text-secondary mt-2">Volume trend (Last 7 workouts)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActivityHeatmap({ data }) {
    // Generate last 365 days
    const today = new Date();
    const days = eachDayOfInterval({
        start: subDays(today, 364),
        end: today
    });

    const dataMap = new Map(data.map(d => [d.date, d.count]));

    return (
        <div className="w-full overflow-hidden">
            <div className="flex gap-1 flex-wrap justify-center md:justify-start opacity-80 hover:opacity-100 transition-opacity" style={{ maxWidth: '100%', height: '120px', flexDirection: 'column', alignContent: 'flex-start' }}>
                {days.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const count = dataMap.get(dateStr) || 0;
                    const brightness = count > 0 ? (count >= 2 ? 'bg-primary' : 'bg-primary/40') : 'bg-white/5';

                    return (
                        <div
                            key={i}
                            title={`${dateStr}: ${count} workouts`}
                            className={`w-2 h-2 rounded-sm ${brightness}`}
                        />
                    );
                })}
            </div>
        </div>
    );
}
