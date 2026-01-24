import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Download, User, Moon, Sun, LogOut, Save } from 'lucide-react';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        ai_personality: 'SERIOUS'
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                username: user.username || '',
                ai_personality: user.ai_personality || 'SERIOUS'
            });
        }
    }, [user]);

    const updateProfile = useMutation({
        mutationFn: (data) => api.put('/users/me', data),
        onSuccess: () => {
            window.location.reload();
        }
    });

    const handleExport = async () => {
        try {
            const response = await api.get('/users/export_data');
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `atlas_export_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (err) {
            alert("Failed to export data.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-6 py-12 md:py-24">
            <div className="mb-12">
                <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default mb-2">
                    👤
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Profile</h1>
                <p className="text-text-secondary text-sm">Manage your account and data.</p>
            </div>

            <div className="space-y-6">
                <section className="notion-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary">Account Info</h3>
                        <button
                            onClick={() => updateProfile.mutate(formData)}
                            disabled={updateProfile.isPending}
                            className="flex items-center gap-2 text-xs font-bold text-primary hover:text-accent transition-colors disabled:opacity-50"
                        >
                            <Save size={14} />
                            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1 block">Full Name</label>
                            <input
                                className="w-full bg-surface/50 border border-border-subtle rounded-lg px-4 py-2 text-text-primary outline-none focus:border-primary transition-all"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1 block">
                                Username <span className="text-text-secondary/50 lowercase font-normal">(optional display name)</span>
                            </label>
                            <input
                                className="w-full bg-surface/50 border border-border-subtle rounded-lg px-4 py-2 text-text-primary outline-none focus:border-primary transition-all"
                                placeholder="@username"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                            <p className="text-[10px] text-text-secondary mt-1">
                                This will be displayed on your Dashboard greeting.
                            </p>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1 block">Email</label>
                            <input
                                className="w-full bg-surface/20 border border-transparent rounded-lg px-4 py-2 text-text-secondary cursor-not-allowed"
                                value={user?.email || ''}
                                disabled
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1 block">AI Personality</label>
                            <select
                                className="w-full bg-surface/50 border border-border-subtle rounded-lg px-4 py-2 text-text-primary outline-none focus:border-primary transition-all cursor-pointer"
                                value={formData.ai_personality}
                                onChange={e => setFormData({ ...formData, ai_personality: e.target.value })}
                            >
                                <option value="SERIOUS">Serious (Default)</option>
                                <option value="SARCASTIC">Sarcastic</option>
                                <option value="CHEERFUL">Cheerful</option>
                            </select>
                            <p className="text-[10px] text-text-secondary mt-1">
                                Determines how the AI Assistant talks to you.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="notion-card p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6">Preferences</h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                            <span className="font-medium text-text-primary">App Theme</span>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="bg-surface border border-border-subtle px-4 py-2 rounded text-sm hover:bg-hover transition-all"
                        >
                            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                        </button>
                    </div>
                </section>

                <section className="notion-card p-6 border-l-4 border-l-primary">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6">Data Management</h3>
                    <p className="text-sm text-text-secondary mb-4">
                        Download a copy of all your data (Attributes, Habits, Projects, Expenses, Notes) in JSON format.
                    </p>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded text-sm hover:bg-primary/20 transition-all font-medium"
                    >
                        <Download size={16} />
                        Export All Data
                    </button>
                </section>

                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded text-accent hover:bg-accent/5 border border-transparent hover:border-accent/10 transition-all mt-8"
                >
                    <LogOut size={16} />
                    Log Out
                </button>
            </div>
        </div>
    );
}
