import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { X, Save, Plus, CheckCircle, Circle, Trash2, Calendar, Tag, Flag } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function ProjectDetailModal({ isOpen, onClose, project }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('idea');
    const [priority, setPriority] = useState('medium');
    const [deadline, setDeadline] = useState('');
    const [tags, setTags] = useState('');

    // Todo state
    const [newTodo, setNewTodo] = useState('');
    const [todoDate, setTodoDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const queryClient = useQueryClient();

    // Reset form when project changes
    useEffect(() => {
        if (project) {
            setName(project.name);
            setDescription(project.description || '');
            setStatus(project.status || 'idea');
            setPriority(project.priority || 'medium');
            setDeadline(project.deadline || '');
            setTags(project.tags || '');
        }
    }, [project]);

    // Fetch Project Todos
    const { data: todos = [] } = useQuery({
        queryKey: ['project-todos', project?.id],
        queryFn: () => api.get(`/projects/${project.id}/todos`).then(res => res.data),
        enabled: !!project && isOpen
    });

    const updateProject = useMutation({
        mutationFn: (data) => api.put(`/projects/${project.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            onClose();
        }
    });

    const createTodo = useMutation({
        mutationFn: (content) => api.post('/todos/', {
            content,
            date: todoDate,
            project_id: project.id,
            priority: priority // Inherit project priority? Or default to medium.
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-todos', project?.id] });
            queryClient.invalidateQueries({ queryKey: ['projects'] }); // Update counts
            setNewTodo('');
        }
    });

    const toggleTodo = useMutation({
        mutationFn: (todo) => api.patch(`/todos/${todo.id}`, { is_completed: !todo.is_completed }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-todos', project?.id] });
            queryClient.invalidateQueries({ queryKey: ['projects'] }); // Update counts
        }
    });

    const deleteTodo = useMutation({
        mutationFn: (id) => api.delete(`/todos/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-todos', project?.id] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });

    const handleSave = (e) => {
        e.preventDefault();
        updateProject.mutate({
            name, description, status, priority, deadline: deadline || null, tags
        });
    };

    const handleAddTodo = (e) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        createTodo.mutate(newTodo);
    };

    if (!isOpen || !project) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] w-full max-w-4xl max-h-[90vh] rounded-3xl border border-border-subtle shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-xl">
                            📂
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{name || 'Project Details'}</h2>
                            <p className="text-xs text-text-secondary uppercase tracking-widest font-bold">{status.replace('_', ' ')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-text-secondary" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0 flex flex-col md:flex-row">

                    {/* Left: Metadata Form */}
                    <div className="w-full md:w-1/3 p-6 border-r border-white/5 space-y-6">
                        <form id="project-form" onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1 block">Project Name</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-surface/50 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1 block">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-surface/50 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
                                >
                                    <option value="idea">Idea</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1 block">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full bg-surface/50 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1 block">Deadline</label>
                                    <input
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="w-full bg-surface/50 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1 block">Tags</label>
                                <input
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="e.g. #dev, #urgent"
                                    className="w-full bg-surface/50 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1 block">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5}
                                    className="w-full bg-surface/50 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary resize-none"
                                />
                            </div>
                        </form>
                    </div>

                    {/* Right: Tasks & Progress */}
                    <div className="w-full md:w-2/3 p-6 bg-surface/5 flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4 flex items-center gap-2">
                                <CheckCircle size={14} /> Linked Tasks
                            </h3>

                            {/* Add Task */}
                            <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
                                <input
                                    value={newTodo}
                                    onChange={(e) => setNewTodo(e.target.value)}
                                    placeholder="Add a new task..."
                                    className="flex-1 bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                                />
                                <input
                                    type="date"
                                    value={todoDate}
                                    onChange={(e) => setTodoDate(e.target.value)}
                                    className="w-32 bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-secondary outline-none"
                                    style={{ colorScheme: 'dark' }}
                                />
                                <button
                                    type="submit"
                                    disabled={!newTodo.trim()}
                                    className="bg-primary/20 text-primary hover:bg-primary hover:text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
                                >
                                    <Plus size={18} />
                                </button>
                            </form>

                            {/* Task List */}
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {todos.length === 0 ? (
                                    <div className="text-center py-8 text-text-secondary italic text-xs border border-dashed border-white/10 rounded-xl">
                                        No tasks linked yet. Add one above.
                                    </div>
                                ) : (
                                    todos.map(todo => (
                                        <div key={todo.id} className="group flex items-center gap-3 p-3 bg-surface rounded-xl border border-border-subtle hover:border-text-secondary/30 transition-all">
                                            <button
                                                onClick={() => toggleTodo.mutate(todo)}
                                                className={`transition-colors ${todo.is_completed ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}
                                            >
                                                {todo.is_completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                                            </button>
                                            <span className={`flex-1 text-sm ${todo.is_completed ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                                                {todo.content}
                                            </span>
                                            <span className="text-[10px] text-text-secondary font-mono">
                                                {format(parseISO(todo.date), 'MMM d')}
                                            </span>
                                            <button
                                                onClick={() => deleteTodo.mutate(todo.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-text-secondary hover:text-red-400 rounded transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-surface/10">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={updateProject.isPending}
                        className="px-6 py-2.5 bg-primary text-background rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                    >
                        {updateProject.isPending ? 'Saving...' : (
                            <>
                                <Save size={14} /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
