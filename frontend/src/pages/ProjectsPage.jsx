import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Plus, Trash2, Edit3, Flag, Calendar, Hash, MoreHorizontal, CheckCircle2, CircleDashed } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import ProjectDetailModal from '../components/ProjectDetailModal';

const COLUMNS = [
    { id: 'idea', label: 'Idea', color: 'bg-purple-500/20 text-purple-400' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500/20 text-blue-400' },
    { id: 'on_hold', label: 'On Hold', color: 'bg-orange-500/20 text-orange-400' },
    { id: 'completed', label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400' }
];

export default function ProjectsPage() {
    const [selectedProject, setSelectedProject] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const queryClient = useQueryClient();

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: () => api.get('/projects').then(res => res.data)
    });

    const createProject = useMutation({
        mutationFn: (initialStatus) => {
            console.log("Attempting to create project with status:", initialStatus);
            return api.post('/projects', {
                name: 'New Project',
                description: '',
                status: initialStatus
            });
        },
        onSuccess: (newProject) => {
            console.log("Project created successfully:", newProject);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setSelectedProject(newProject);
            setIsModalOpen(true);
        },
        onError: (error) => {
            console.error("Failed to create project:", error);
            alert(`Failed to create project: ${error.response?.data?.detail || error.message}`);
        }
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status }) => api.put(`/projects/${id}`, { status }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
    });

    const handleDragStart = (e, projectId) => {
        e.dataTransfer.setData('projectId', projectId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, status) => {
        e.preventDefault();
        const projectId = e.dataTransfer.getData('projectId');
        if (projectId) {
            updateStatus.mutate({ id: projectId, status });
        }
    };

    const groupedProjects = COLUMNS.reduce((acc, col) => {
        acc[col.id] = projects.filter(p => (p.status || 'idea') === col.id);
        return acc;
    }, {});

    const getPriorityColor = (p) => {
        if (p === 'high') return 'text-red-400 bg-red-400/10 border-red-400/20';
        if (p === 'medium') return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    };

    return (
        <div className="w-full h-full max-w-[1920px] mx-auto p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Projects Board</h1>
                    <p className="text-text-secondary text-sm">Manage your workflow and track progress.</p>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex gap-6 min-w-[1200px] h-full">
                    {COLUMNS.map(col => (
                        <div
                            key={col.id}
                            className="flex-1 flex flex-col bg-surface/10 rounded-3xl border border-white/5 min-w-[300px]"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            {/* Column Header */}
                            <div className="p-4 flex items-center justify-between border-b border-white/5">
                                <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${col.color}`}>
                                    <span className="w-2 h-2 rounded-full bg-current" />
                                    {col.label}
                                    <span className="opacity-50 ml-1">({groupedProjects[col.id]?.length || 0})</span>
                                </div>
                                <button
                                    onClick={() => createProject.mutate(col.id)}
                                    className="p-1.5 hover:bg-white/10 rounded text-text-secondary hover:text-primary transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {groupedProjects[col.id]?.map(project => {
                                    const completedCount = project.todos?.filter(t => t.is_completed).length || 0;
                                    const totalCount = project.todos?.length || 0;
                                    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                                    return (
                                        <div
                                            key={project.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, project.id)}
                                            onClick={() => { setSelectedProject(project); setIsModalOpen(true); }}
                                            className="bg-surface p-4 rounded-xl border border-border-subtle cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-lg transition-all group relative overflow-hidden"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <h4 className="font-bold text-sm text-text-primary line-clamp-2">{project.name}</h4>
                                                {project.priority && (
                                                    <div className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-widest ${getPriorityColor(project.priority)}`}>
                                                        {project.priority}
                                                    </div>
                                                )}
                                            </div>

                                            {project.description && (
                                                <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                                                    {project.description}
                                                </p>
                                            )}

                                            {/* Progress Bar */}
                                            {totalCount > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-[10px] text-text-secondary mb-1 font-bold uppercase tracking-wider">
                                                        <span>Progress</span>
                                                        <span>{Math.round(progress)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-background rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                                                <div className="flex items-center gap-3 text-text-secondary">
                                                    {project.deadline && (
                                                        <div className="flex items-center gap-1 text-[10px]" title="Deadline">
                                                            <Calendar size={12} />
                                                            <span>{format(parseISO(project.deadline), 'MMM d')}</span>
                                                        </div>
                                                    )}
                                                    {totalCount > 0 && (
                                                        <div className="flex items-center gap-1 text-[10px]" title="Tasks">
                                                            <CheckCircle2 size={12} />
                                                            <span>{completedCount}/{totalCount}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ProjectDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                project={selectedProject}
            />
        </div>
    );
}
