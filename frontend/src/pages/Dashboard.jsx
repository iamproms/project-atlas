import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import api from '../api/client';
import { formatDateForAPI, formatDisplayDate } from '../utils/date';
import {
    CheckCircle,
    Circle,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Layout,
    PlusCircle,
    Calendar,
    ArrowRight,
    Timer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { Link, useNavigate } from 'react-router-dom';
import ExpenseWidget from '../components/ExpenseWidget';
import HabitHeatmap from '../components/HabitHeatmap';
import TodoWidget from '../components/TodoWidget';
import LearningWidget from '../components/LearningWidget';
import WorkoutWidget from '../components/WorkoutWidget';
import LifeScoreWidget from '../components/LifeScoreWidget';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Dashboard Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-12 text-center">
                    <h2 className="text-xl font-bold text-accent mb-4">Something went wrong.</h2>
                    <pre className="text-left bg-surface/50 p-4 rounded text-xs text-text-secondary overflow-auto max-w-lg mx-auto">
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-primary text-background rounded font-bold"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function Dashboard() {
    return (
        <ErrorBoundary>
            <DashboardContent />
        </ErrorBoundary>
    );
}

function DashboardContent() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const dateStr = formatDateForAPI(currentDate);
    const { seconds, isActive } = useTimer(); // Destructure seconds, isActive from useTimer
    const queryClient = useQueryClient();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Queries
    const { data: habits = [] } = useQuery({
        queryKey: ['habits'],
        queryFn: () => api.get('/habits/').then(res => res.data)
    });

    const { data: logs = [] } = useQuery({
        queryKey: ['logs', dateStr], // This is mainly for "Today's" state.
        queryFn: () => api.get(`/habits/logs/${dateStr}`).then(res => res.data)
    });

    // New: Fetch history for Heatmap & Streak
    const { data: historyLogs = [] } = useQuery({
        queryKey: ['habit-history'],
        queryFn: () => api.get('/habits/logs', {
            params: {
                start_date: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
                end_date: format(new Date(), 'yyyy-MM-dd')
            }
        }).then(res => res.data).catch(() => [])
    });

    const { data: focus } = useQuery({
        queryKey: ['focus', dateStr],
        queryFn: () => api.get(`/projects/focus/${dateStr}`).then(res => res.data)
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: () => api.get('/projects').then(res => res.data)
    });

    const { data: note } = useQuery({
        queryKey: ['note', dateStr],
        queryFn: () => api.get(`/daily-notes/${dateStr}`).then(res => res.data)
    });

    // Mutations
    const toggleHabit = useMutation({
        mutationFn: (habitId) => {
            const isCompleted = logs.find(l => l.habit_id === habitId)?.completed;
            return api.post('/habits/logs', {
                habit_id: habitId,
                date: dateStr,
                completed: !isCompleted
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logs', dateStr] });
            queryClient.invalidateQueries({ queryKey: ['habit-history'] });
        }
    });

    const updateNote = useMutation({
        mutationFn: (content) => api.put(`/daily-notes/${dateStr}`, { content }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['note', dateStr] })
    });

    const setFocus = useMutation({
        mutationFn: (projectId) => api.post('/projects/focus', {
            project_id: projectId,
            date: dateStr
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['focus', dateStr] })
    });

    // Note auto-save logic
    const [noteContent, setNoteContent] = useState('');
    useEffect(() => {
        if (note) setNoteContent(note.content);
        else setNoteContent('');
    }, [note, dateStr]);

    const handleNoteBlur = () => {
        if (noteContent !== (note?.content || '')) {
            updateNote.mutate(noteContent);
        }
    };

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">
            {/* Header Area */}
            <div className="mb-8">
                <div className="group flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default">
                        📖
                    </div>
                </div>
                <h1 className="text-5xl font-bold tracking-tight mb-2 flex items-center gap-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pb-2">
                    Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.username || (user?.full_name || 'User').split(' ')[0]}
                </h1>
                <p className="text-text-secondary text-lg">Here's your overview for today.</p>

                {/* Properties Area */}
                {/* Action Bar used to be Properties Area */}
                <div className="mt-8 bg-surface/40 border border-border-subtle rounded-2xl p-2 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
                    {/* Date Navigation */}
                    <div className="flex items-center gap-2 w-full md:w-auto bg-surface/50 p-1 rounded-xl border border-border-subtle">
                        <button
                            onClick={() => setCurrentDate(subDays(currentDate, 1))}
                            className="p-2 hover:bg-hover rounded-lg text-text-secondary hover:text-text-primary transition-all"
                            title="Previous Day"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex-1 md:flex-none text-center px-4 font-bold text-text-primary flex items-center justify-center gap-2 min-w-[140px]">
                            <Calendar size={14} className="text-primary" />
                            {formatDisplayDate(currentDate)}
                        </div>
                        <button
                            onClick={() => setCurrentDate(addDays(currentDate, 1))}
                            className="p-2 hover:bg-hover rounded-lg text-text-secondary hover:text-text-primary transition-all"
                            title="Next Day"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <div className="h-6 w-px bg-border-subtle mx-1" />
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-background rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Today
                        </button>
                    </div>

                    {/* Live Clock */}
                    <div className="hidden md:flex items-center gap-2 bg-surface/50 px-4 py-2 rounded-xl border border-border-subtle text-text-primary font-mono font-bold text-lg">
                        {format(time, 'HH:mm')}
                    </div>

                    {/* Focus Selector */}
                    <div className="w-full md:w-auto relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                            <Layout size={16} />
                        </div>
                        <select
                            onChange={(e) => e.target.value && setFocus.mutate(e.target.value)}
                            value={focus?.project_id || ""}
                            className="w-full md:min-w-[240px] appearance-none bg-surface/50 hover:bg-hover border border-border-subtle hover:border-text-secondary/20 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-text-primary outline-none focus:border-primary transition-all cursor-pointer"
                        >
                            <option value="" disabled>Select Daily Focus...</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        {focus && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Active Timer Banner */}
            {isActive && (
                <div className="mb-8 w-full bg-gradient-to-r from-primary to-accent p-1 rounded-3xl animate-in slide-in-from-top-4">
                    <div className="bg-background rounded-[1.4rem] p-4 px-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-full animate-pulse text-primary">
                                <Timer size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">Focus Mode Active</p>
                                <p className="text-2xl font-mono font-bold tabular-nums">
                                    {Math.floor(seconds / 3600) > 0 ? `${Math.floor(seconds / 3600)}:` : ''}
                                    {Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}:
                                    {(seconds % 60).toString().padStart(2, '0')}
                                </p>
                            </div>
                        </div>
                        <Link to="/learning" className="px-4 py-2 bg-primary text-background rounded-xl text-sm font-bold hover:scale-105 transition-all">
                            View Timer
                        </Link>
                    </div>
                </div>
            )}

            {/* Bento Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-12">

                {/* Main Focus / Habits Area - Spans 8 cols */}
                <div className="md:col-span-8 space-y-6">
                    <section className="bg-surface/40 p-8 rounded-3xl border border-border-subtle backdrop-blur-md shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary">Habit Consistency</h2>
                            <Link to="/habits" className="p-2 hover:bg-surface rounded-full text-text-secondary hover:text-primary transition-all">
                                <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="mb-8">
                            <HabitHeatmap habits={habits} logs={historyLogs} />
                        </div>

                        <div className="space-y-3">
                            {habits.length === 0 ? (
                                <p className="text-sm text-text-secondary italic">No habits added. Head to projects to add some.</p>
                            ) : (
                                habits.map(habit => {
                                    const isCompleted = logs.find(l => l.habit_id === habit.id)?.completed;
                                    return (
                                        <div
                                            key={habit.id}
                                            onClick={() => toggleHabit.mutate(habit.id)}
                                            className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${isCompleted
                                                ? 'bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(46,170,220,0.15)]'
                                                : 'bg-surface/50 border-transparent hover:border-border-subtle hover:bg-surface'
                                                }`}
                                        >
                                            <span className={`font-medium transition-all ${isCompleted ? 'text-primary' : 'text-text-primary'}`}>
                                                {habit.name}
                                            </span>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? 'border-primary bg-primary text-background' : 'border-text-secondary/30'
                                                }`}>
                                                {isCompleted && <CheckCircle size={14} strokeWidth={4} />}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </section>

                    {/* Row 2: Learning & Workouts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-surface/40 p-6 rounded-3xl border border-border-subtle backdrop-blur-md">
                            <LearningWidget dateStr={dateStr} />
                        </div>
                        <div className="bg-surface/40 p-6 rounded-3xl border border-border-subtle backdrop-blur-md">
                            <WorkoutWidget dateStr={dateStr} />
                        </div>
                    </div>
                </div>

                {/* Right Column - Spans 4 cols */}
                <div className="md:col-span-4 space-y-6">
                    {/* Life Score */}
                    <LifeScoreWidget dateStr={dateStr} />

                    {/* Todos - Tall vertical list */}
                    <section className="bg-surface/40 p-6 rounded-3xl border border-border-subtle backdrop-blur-md min-h-[500px]">
                        <TodoWidget dateStr={dateStr} />
                    </section>

                    {/* Mini Expenses Summary */}
                    <section className="bg-surface/40 p-6 rounded-3xl border border-border-subtle backdrop-blur-md">
                        <ExpenseWidget dateStr={dateStr} />
                    </section>
                </div>

                {/* Full Width Bottom - Journal */}
                <div className="md:col-span-12">
                    <section className="bg-surface/40 p-8 rounded-3xl border border-border-subtle backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-accent/50 group-hover:bg-accent transition-colors" />

                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary flex items-center gap-2">
                                <span>Daily Reflection</span>
                            </h2>
                            <Link to="/journal" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
                                Open Journal <ArrowRight size={12} />
                            </Link>
                        </div>

                        <div
                            onClick={() => navigate('/journal')}
                            className="text-lg leading-relaxed text-text-primary/80 group-hover:text-text-primary transition-colors cursor-pointer font-serif italic"
                        >
                            "{noteContent || "Write something about today..."}"
                        </div>
                    </section>
                </div>

            </div>
        </div>
    );
}
