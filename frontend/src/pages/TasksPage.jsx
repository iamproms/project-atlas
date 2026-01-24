import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import api from '../api/client';
import {
    CheckCircle2,
    Circle,
    Plus,
    Trash2,
    RefreshCcw,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ListTodo
} from 'lucide-react';
import { formatDateForAPI, formatDisplayDate } from '../utils/date';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PRIORITIES = [
    { label: 'Low', value: 'low', color: 'text-text-secondary' },
    { label: 'Medium', value: 'medium', color: 'text-primary' },
    { label: 'Urgent', value: 'high', color: 'text-accent' },
];

export default function TasksPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const dateStr = formatDateForAPI(selectedDate);
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState('medium');
    const [isAdding, setIsAdding] = useState(false);

    const queryClient = useQueryClient();

    const { data: todos = [] } = useQuery({
        queryKey: ['todos', dateStr],
        queryFn: () => api.get(`/todos/${dateStr}`).then(res => res.data)
    });

    // For the weekly view
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const createTodo = useMutation({
        mutationFn: (newTodo) => api.post('/todos/', newTodo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['todos', dateStr] });
            setContent('');
            setIsAdding(false);
        }
    });

    const toggleTodo = useMutation({
        mutationFn: ({ id, is_completed }) => api.patch(`/todos/${id}`, { is_completed }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos', dateStr] })
    });

    const deleteTodo = useMutation({
        mutationFn: (id) => api.delete(`/todos/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos', dateStr] })
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        createTodo.mutate({
            content,
            date: dateStr,
            priority
        });
    };

    // Carry Over Logic
    const yesterdayStr = formatDateForAPI(subDays(selectedDate, 1));
    const { data: yesterdayTodos = [] } = useQuery({
        queryKey: ['todos', yesterdayStr],
        queryFn: () => api.get(`/todos/${yesterdayStr}`).then(res => res.data),
        enabled: !!selectedDate // Only fetch when needed
    });

    const carryOverTasks = useMutation({
        mutationFn: async () => {
            const incomplete = yesterdayTodos.filter(t => !t.is_completed);
            if (incomplete.length === 0) return;

            // Create all incomplete tasks for today
            const promises = incomplete.map(t => api.post('/todos/', {
                content: t.content,
                priority: t.priority,
                date: dateStr,
                is_carried_over: true
            }));
            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['todos', dateStr] });
        }
    });

    const incompleteCount = yesterdayTodos.filter(t => !t.is_completed).length;

    // Mock data for weekly chart
    const weeklyChartData = weekDays.map(day => ({
        name: format(day, 'EEE'), // e.g., Mon, Tue
        tasks: Math.floor(Math.random() * 10) + 1 // Mock task count
    }));

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">
            <div className="mb-12">
                <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default mb-2">
                    ✅
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Tasks</h1>
                <p className="text-text-secondary text-lg">Focus and execution.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Calendar & Date Nav - 5 cols */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="bg-surface/40 p-8 rounded-3xl border border-border-subtle backdrop-blur-md">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary">Schedule</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedDate(subDays(selectedDate, 7))}
                                    className="p-2 hover:bg-surface rounded-xl text-text-secondary hover:text-text-primary transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-sm font-bold tabular-nums">Week {format(selectedDate, 'w')}</span>
                                <button
                                    onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                                    className="p-2 hover:bg-surface rounded-xl text-text-secondary hover:text-text-primary transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2 mb-8">
                            {weekDays.map(day => {
                                const isSelected = format(day, 'yyyy-MM-dd') === dateStr;
                                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                return (
                                    <button
                                        key={day.toString()}
                                        onClick={() => setSelectedDate(day)}
                                        className={`flex flex-col items-center p-3 rounded-2xl transition-all border ${isSelected
                                            ? 'bg-primary text-background shadow-lg scale-110'
                                            : 'bg-surface/50 border-transparent hover:border-border-subtle hover:bg-surface text-text-secondary hover:text-text-primary'
                                            }`}
                                    >
                                        <span className="text-[10px] uppercase font-bold tracking-widest mb-1 opacity-70">{format(day, 'EEE')}</span>
                                        <span className="text-xl font-black tabular-nums">{format(day, 'd')}</span>
                                        {isToday && !isSelected && <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Weekly Chart */}
                        <div className="pt-8 border-t border-border-subtle">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary mb-4">Weekly Load</h2>
                            <ResponsiveContainer width="100%" height={128}>
                                <BarChart data={weeklyChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                                    <YAxis hide domain={[0, 'dataMax + 2']} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--surface)' }}
                                        contentStyle={{
                                            backgroundColor: 'var(--surface)',
                                            borderColor: 'var(--border-subtle)',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            color: 'var(--text-primary)'
                                        }}
                                        labelStyle={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}
                                        formatter={(value, name) => [`${value} tasks`, name]}
                                    />
                                    <Bar dataKey="tasks" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column: Task List - 7 cols */}
                <div className="lg:col-span-7">
                    <div className="bg-surface/40 p-8 rounded-3xl border border-border-subtle backdrop-blur-md min-h-[600px]">
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-border-subtle">
                            <h3 className="font-bold text-2xl text-text-primary flex items-center gap-3">
                                {formatDisplayDate(selectedDate)}
                            </h3>
                            <div className="flex gap-2">
                                {incompleteCount > 0 && isSameDay(selectedDate, new Date()) && (
                                    <button
                                        onClick={() => carryOverTasks.mutate()}
                                        disabled={carryOverTasks.isPending}
                                        className="flex items-center gap-2 bg-surface hover:bg-hover border border-border-subtle text-text-secondary hover:text-primary px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                                        title={`${incompleteCount} incomplete tasks from yesterday`}
                                    >
                                        <RefreshCcw size={16} className={carryOverTasks.isPending ? 'animate-spin' : ''} />
                                        {carryOverTasks.isPending ? 'Moving...' : `Carry Over (${incompleteCount})`}
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="flex items-center gap-2 bg-primary text-background px-5 py-2.5 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    <Plus size={16} /> New Task
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {todos.length === 0 && !isAdding && (
                                <div className="h-64 flex flex-col items-center justify-center text-text-secondary">
                                    <div className="w-20 h-20 bg-surface/50 rounded-full flex items-center justify-center mb-6">
                                        <ListTodo size={32} className="opacity-20" />
                                    </div>
                                    <p className="text-sm font-medium">No tasks scheduled.</p>
                                    <button onClick={() => setIsAdding(true)} className="mt-2 text-xs text-primary hover:underline">Add one now</button>
                                </div>
                            )}

                            {todos.map(todo => (
                                <div key={todo.id} className="group flex items-center gap-4 p-4 rounded-2xl bg-surface/50 border border-transparent hover:border-border-subtle hover:shadow-sm transition-all">
                                    <button
                                        onClick={() => toggleTodo.mutate({ id: todo.id, is_completed: !todo.is_completed })}
                                        className={`p-1 rounded-full transition-all ${todo.is_completed ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                    >
                                        {todo.is_completed ? <CheckCircle2 size={24} className="fill-current" /> : <Circle size={24} />}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <p className={`text-base font-medium transition-all ${todo.is_completed ? 'text-text-secondary line-through decoration-2 decoration-border-subtle' : 'text-text-primary'}`}>
                                            {todo.content}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${todo.priority === 'high' ? 'bg-accent/10 text-accent' :
                                                todo.priority === 'medium' ? 'bg-primary/10 text-primary' :
                                                    'bg-text-secondary/10 text-text-secondary'
                                                }`}>
                                                {todo.priority}
                                            </span>
                                            {todo.is_carried_over && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-text-secondary/70">
                                                    <RefreshCcw size={10} /> Carried Over
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => deleteTodo.mutate(todo.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-surface text-text-secondary hover:text-accent transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}

                            {isAdding && (
                                <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-surface border-2 border-primary/20 space-y-4 animate-in slide-in-from-top-2 shadow-xl">
                                    <input
                                        className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-text-secondary/40"
                                        placeholder="What needs to be done?"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex gap-1">
                                            {PRIORITIES.map(p => (
                                                <button
                                                    key={p.value}
                                                    type="button"
                                                    onClick={() => setPriority(p.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${priority === p.value
                                                        ? 'bg-primary text-background border-primary'
                                                        : 'border-transparent bg-surface/50 text-text-secondary hover:bg-hover'
                                                        }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsAdding(false)}
                                                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-hover transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-primary text-background px-6 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-all"
                                            >
                                                Save Task
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
