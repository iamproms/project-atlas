import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Plus, Trash2, Layout, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProjectsPage() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const queryClient = useQueryClient();

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: () => api.get('/projects').then(res => res.data)
    });

    const createProject = useMutation({
        mutationFn: (newProject) => api.post('/projects', newProject),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setName('');
            setDescription('');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        createProject.mutate({ name, description });
    };

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">
            <div className="mb-12">
                <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default mb-2">
                    📂
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Projects</h1>
                <p className="text-text-secondary text-lg">Manage your long-term focuses and tracking metrics.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Create Form */}
                <div className="lg:col-span-4">
                    <section className="bg-surface/40 p-8 rounded-3xl border border-border-subtle backdrop-blur-md sticky top-8">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary mb-6 flex items-center gap-2">
                            <span>Initialize Project</span>
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-2 block">Project Name</label>
                                <input
                                    className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-all placeholder:text-text-secondary/20"
                                    placeholder="e.g. Website Redesign"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-2 block">Details</label>
                                <textarea
                                    className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-all placeholder:text-text-secondary/20 min-h-[120px] resize-none"
                                    placeholder="Project goals, success criteria..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={createProject.isPending}
                                className="w-full py-3 bg-primary text-background rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                            >
                                <Plus size={16} />
                                {createProject.isPending ? 'Syncing...' : 'Create Project'}
                            </button>
                        </form>
                    </section>
                </div>

                {/* Right Column: Project List */}
                <div className="lg:col-span-8">
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary/60 mb-6 flex items-center gap-2">
                            <span>Active Projects</span>
                            <div className="h-px flex-1 bg-border-subtle" />
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {projects.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-text-secondary italic bg-surface/10 rounded-3xl border border-dashed border-border-subtle">
                                    No active projects found. Start one on the left.
                                </div>
                            ) : (
                                projects.map(project => (
                                    <div key={project.id} className="group p-6 rounded-3xl bg-surface/30 border border-border-subtle hover:border-text-secondary/30 transition-all hover:shadow-lg flex flex-col justify-between min-h-[160px]">
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between">
                                                <h4 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors">{project.name}</h4>
                                                <div className="p-2 rounded-full bg-surface/50 text-text-secondary group-hover:text-primary transition-colors">
                                                    <Layout size={16} />
                                                </div>
                                            </div>
                                            <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                                                {project.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        <div className="pt-4 mt-auto flex items-center gap-2">
                                            <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary">
                                                Active
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
