import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import {
    CheckCircle2,
    Circle,
    Plus,
    Trash2,
    ArrowUpCircle,
    RefreshCcw,
    AlertCircle
} from 'lucide-react';
import { format, subDays } from 'date-fns';

const PRIORITIES = [
    { label: 'Low', value: 'low', color: 'text-text-secondary' },
    { label: 'Medium', value: 'medium', color: 'text-primary' },
    { label: 'Urgent', value: 'high', color: 'text-accent' },
];

export default function TodoWidget({ dateStr }) {
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState('medium');
    const [isAdding, setIsAdding] = useState(false);

    const queryClient = useQueryClient();

    const { data: todos = [] } = useQuery({
        queryKey: ['todos', dateStr],
        queryFn: () => api.get(`/todos/${dateStr}`).then(res => res.data)
    });

    // Check for yesterday's pending tasks (for carry-over prompt)
    const yesterdayStr = format(subDays(new Date(dateStr), 1), 'yyyy-MM-dd');
    const { data: yesterdayTodos = [] } = useQuery({
        queryKey: ['todos', yesterdayStr],
        queryFn: () => api.get(`/todos/${yesterdayStr}`).then(res => res.data),
        enabled: !!dateStr
    });

    const pendingYesterday = yesterdayTodos.filter(t => !t.is_completed).length;

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

    const carryOver = useMutation({
        mutationFn: () => api.post(`/todos/carry-over/${dateStr}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['todos', dateStr] });
            queryClient.invalidateQueries({ queryKey: ['todos', yesterdayStr] });
        }
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

    return (
        <section className="animate-in fade-in duration-500">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary/60 mb-6 flex items-center gap-2">
                <span>Todo List</span>
                <div className="h-px flex-1 bg-border-subtle" />
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-1 hover:bg-hover rounded transition-colors text-text-primary"
                >
                    <Plus size={14} />
                </button>
            </h2>

            <div className="space-y-4">
                {/* Carry Over Prompt */}
                {pendingYesterday > 0 && format(new Date(), 'yyyy-MM-dd') === dateStr && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <RefreshCcw size={16} className="text-primary animate-spin-slow" />
                            <div>
                                <p className="text-sm font-semibold text-text-primary">Yesterday's tasks</p>
                                <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">
                                    {pendingYesterday} pending tasks from yesterday
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => carryOver.mutate()}
                            disabled={carryOver.isPending}
                            className="bg-primary text-background px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            {carryOver.isPending ? 'Moving...' : 'Roll Over'}
                        </button>
                    </div>
                )}

                {/* List */}
                <div className="space-y-1">
                    {todos.length === 0 && !isAdding && (
                        <p className="text-sm text-text-secondary italic px-2">No tasks for today. Take it easy.</p>
                    )}
                    {todos.map(todo => (
                        <div key={todo.id} className="group flex items-center gap-3 py-1.5 px-2 -mx-2 hover:bg-hover rounded transition-all">
                            <button
                                onClick={() => toggleTodo.mutate({ id: todo.id, is_completed: !todo.is_completed })}
                                className={`transition-all ${todo.is_completed ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                {todo.is_completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </button>

                            <div className="flex-1 min-w-0">
                                <span className={`text-[15px] transition-all ${todo.is_completed ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                                    {todo.content}
                                </span>
                                {todo.is_carried_over && (
                                    <span className="ml-2 text-[8px] uppercase font-bold bg-text-secondary/10 text-text-secondary px-1 py-0.5 rounded tracking-tighter">Carried Over</span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${PRIORITIES.find(p => p.value === todo.priority)?.color}`}>
                                    {todo.priority}
                                </span>
                                <button
                                    onClick={() => deleteTodo.mutate(todo.id)}
                                    className="text-text-secondary hover:text-accent transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Form */}
                {isAdding && (
                    <form onSubmit={handleSubmit} className="bg-surface/30 p-4 rounded border border-border-subtle space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex gap-4">
                            <input
                                className="flex-1 notion-input text-base"
                                placeholder="What needs to be done?"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                {PRIORITIES.map(p => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() => setPriority(p.value)}
                                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${priority === p.value
                                            ? 'bg-primary/10 border-primary/40 text-primary'
                                            : 'border-transparent text-text-secondary hover:bg-hover'
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
                                    className="px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createTodo.isPending}
                                    className="px-3 py-1.5 bg-primary text-background rounded text-xs font-bold hover:opacity-90 transition-opacity"
                                >
                                    Save Task
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
}
