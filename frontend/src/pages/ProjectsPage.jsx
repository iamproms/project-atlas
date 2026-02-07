import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import {
    Plus,
    Trash2,
    ChevronRight,
    ChevronDown,
    Calendar,
    CheckCircle2,
    AlertCircle,
    MoreHorizontal
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PRIORITY_COLORS = {
    high: 'text-red-400 bg-red-400/10 border-red-400/20',
    medium: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    low: 'text-blue-400 bg-blue-400/10 border-blue-400/20'
};

const STATUS_CONFIG = {
    idea: { label: 'Idea', color: 'text-purple-400 bg-purple-400/10' },
    in_progress: { label: 'In Progress', color: 'text-blue-400 bg-blue-400/10' },
    on_hold: { label: 'On Hold', color: 'text-orange-400 bg-orange-400/10' },
    completed: { label: 'Completed', color: 'text-emerald-400 bg-emerald-400/10' }
};

export default function ProjectsPage() {
    const queryClient = useQueryClient();
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [newProjectName, setNewProjectName] = useState('');

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => api.get('/projects/').then(res => res.data)
    });

    const createProject = useMutation({
        mutationFn: (name) => api.post('/projects/', { name, status: 'idea' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setNewProjectName('');
        }
    });

    const updateProject = useMutation({
        mutationFn: ({ id, data }) => api.put(`/projects/${id}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
    });

    const deleteProject = useMutation({
        mutationFn: (id) => api.delete(`/projects/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
    });

    const toggleRow = (id) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedRows(newSet);
    };

    const handleQuickAdd = (e) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            createProject.mutate(newProjectName);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-text-secondary">Loading ledger...</div>;

    return (
        <div className="w-full max-w-[1200px] mx-auto p-6 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Projects Ledger</h1>
                <p className="text-text-secondary text-sm">Manage, track, and execute your projects.</p>
            </div>

            <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="grid grid-cols-[40px_2fr_120px_100px_120px_100px_40px] gap-4 p-4 border-b border-white/5 bg-surface/50 text-xs font-bold text-text-secondary uppercase tracking-wider items-center">
                    <div></div>
                    <div>Project Name</div>
                    <div>Status</div>
                    <div>Priority</div>
                    <div>Deadline</div>
                    <div>Progress</div>
                    <div></div>
                </div>

                {/* Quick Add Row */}
                <form onSubmit={handleQuickAdd} className="grid grid-cols-[40px_2fr_120px_100px_120px_100px_40px] gap-4 p-3 border-b border-white/5 bg-primary/5 hover:bg-primary/10 transition-colors items-center group relative">
                    <div className="flex justify-center text-primary"><Plus size={18} /></div>
                    <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Start a new project... (Press Enter)"
                        className="bg-transparent border-none focus:ring-0 p-0 text-sm font-medium placeholder:text-text-secondary text-text-primary h-8 w-full"
                        autoFocus
                    />
                    <div className="text-xs text-text-secondary opacity-50">Idea</div>
                    <div className="text-xs text-text-secondary opacity-50">Medium</div>
                    <div className="text-xs text-text-secondary opacity-50">-</div>
                    <div className="text-xs text-text-secondary opacity-50">0%</div>
                    <button type="submit" disabled={!newProjectName.trim()} className="p-1.5 hover:bg-primary text-primary-foreground rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:text-text-secondary">
                        <Plus size={16} />
                    </button>
                </form>

                {/* Project Rows */}
                <div className="divide-y divide-white/5">
                    {projects.map(project => (
                        <ProjectRow
                            key={project.id}
                            project={project}
                            isExpanded={expandedRows.has(project.id)}
                            onToggle={() => toggleRow(project.id)}
                            onUpdate={(data) => updateProject.mutate({ id: project.id, data })}
                            onDelete={() => deleteProject.mutate(project.id)}
                        />
                    ))}
                    {projects.length === 0 && (
                        <div className="p-8 text-center text-text-secondary text-sm">
                            No projects yet. Start one above!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProjectRow({ project, isExpanded, onToggle, onUpdate, onDelete }) {
    const todos = project.todos || [];
    const completedCount = todos.filter(t => t.is_completed).length;
    const progress = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;
    const [name, setName] = useState(project.name);

    return (
        <div className="group bg-surface hover:bg-white/[0.02] transition-colors">
            {/* Main Row */}
            <div className="grid grid-cols-[40px_2fr_120px_100px_120px_100px_40px] gap-4 p-4 items-center h-[60px]">

                {/* Expand Toggle */}
                <button onClick={onToggle} className="flex justify-center text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-white/5">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {/* Name (Editable) */}
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => { if (name !== project.name) onUpdate({ name }); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    className="bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-text-primary placeholder:text-text-secondary/50 w-full"
                />

                {/* Status Dropdown */}
                <div className="relative">
                    <select
                        value={project.status || 'idea'}
                        onChange={(e) => onUpdate({ status: e.target.value })}
                        className={`appearance-none w-full bg-transparent text-[11px] font-bold uppercase tracking-wider border-none focus:ring-0 cursor-pointer rounded px-2 py-1 pr-6 ${STATUS_CONFIG[project.status || 'idea'].color}`}
                    >
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key} className="bg-surface text-text-primary">{config.label}</option>
                        ))}
                    </select>
                </div>

                {/* Priority Dropdown */}
                <div className="relative">
                    <select
                        value={project.priority || 'medium'}
                        onChange={(e) => onUpdate({ priority: e.target.value })}
                        className={`appearance-none w-full bg-transparent text-[10px] font-bold uppercase tracking-wider border border-transparent hover:border-white/10 focus:ring-0 cursor-pointer rounded px-2 py-0.5 pr-4 ${PRIORITY_COLORS[project.priority || 'medium']}`}
                    >
                        <option value="low" className="bg-surface text-text-primary">Low</option>
                        <option value="medium" className="bg-surface text-text-primary">Medium</option>
                        <option value="high" className="bg-surface text-text-primary">High</option>
                    </select>
                </div>

                {/* Deadline */}
                <div className="relative flex items-center group/date cursor-pointer">
                    <Calendar size={14} className="text-text-secondary group-hover/date:text-primary transition-colors mr-2" />
                    <span className={`text-xs ${project.deadline ? 'text-text-primary' : 'text-text-secondary italic'}`}>
                        {project.deadline ? format(parseISO(project.deadline), 'MMM d') : 'Set Date'}
                    </span>
                    <input
                        type="date"
                        value={project.deadline || ''}
                        onChange={(e) => onUpdate({ deadline: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-medium text-text-secondary w-8 text-right">{progress}%</span>
                </div>

                {/* Actions */}
                <div className="relative group/menu flex justify-center">
                    <button className="text-text-secondary hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-400/10 rounded" onClick={onDelete} title="Delete Project">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4">
                    <div className="pl-[56px] pr-4">
                        <div className="bg-background/40 rounded-lg p-4 border border-white/5 space-y-4 shadow-inner">
                            <div>
                                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Description</h4>
                                <textarea
                                    className="w-full bg-transparent border-none text-sm text-text-secondary placeholder:text-text-secondary/30 focus:ring-0 resize-none p-0 focus:text-text-primary transition-colors"
                                    placeholder="Add a detailed description..."
                                    defaultValue={project.description}
                                    onBlur={(e) => onUpdate({ description: e.target.value })}
                                    rows={1}
                                    onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                                />
                            </div>

                            <hr className="border-white/5" />

                            <div>
                                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>Action Plan</span>
                                </h4>
                                <ProjectTodoList projectId={project.id} todos={todos} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProjectTodoList({ projectId, todos }) {
    const queryClient = useQueryClient();
    const [newTodo, setNewTodo] = useState('');

    const createTodo = useMutation({
        mutationFn: (content) => api.post('/todos/', {
            content,
            date: format(new Date(), 'yyyy-MM-dd'),
            project_id: projectId
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setNewTodo('');
        }
    });

    const toggleTodo = useMutation({
        mutationFn: ({ id, is_completed }) => api.put(`/todos/${id}`, { is_completed }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
    });

    const handleAdd = (e) => {
        e.preventDefault();
        if (newTodo.trim()) createTodo.mutate(newTodo);
    };

    return (
        <div className="space-y-1">
            {todos.sort((a, b) => (a.is_completed === b.is_completed) ? 0 : a.is_completed ? 1 : -1).map(todo => (
                <div key={todo.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded group">
                    <button
                        onClick={() => toggleTodo.mutate({ id: todo.id, is_completed: !todo.is_completed })}
                        className={`transition-colors ${todo.is_completed ? 'text-emerald-500' : 'text-text-secondary hover:text-primary'}`}
                    >
                        <CheckCircle2 size={14} className={todo.is_completed ? "fill-current/20" : ""} />
                    </button>
                    <span className={`text-sm ${todo.is_completed ? 'text-text-secondary/50 line-through' : 'text-text-primary'}`}>
                        {todo.content}
                    </span>
                    <button
                        onClick={() => {
                            if (confirm('Delete task?')) {
                                api.delete(`/todos/${todo.id}`).then(() => queryClient.invalidateQueries({ queryKey: ['projects'] }));
                            }
                        }}
                        className="ml-auto text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            ))}

            <form onSubmit={handleAdd} className="mt-2 flex items-center gap-3 p-2 text-text-secondary opacity-70 hover:opacity-100 transition-opacity">
                <Plus size={14} />
                <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Add a task..."
                    className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full placeholder:text-text-secondary/50"
                />
            </form>
        </div>
    );
}
