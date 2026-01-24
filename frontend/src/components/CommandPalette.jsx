import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
    Search,
    Calendar,
    CreditCard,
    Layers,
    ArrowRight,
    Command as CommandIcon,
    ListTodo,
    BookOpen,
    Dumbbell,
    PenTool,
    Sparkles,
    User,
    LogOut,
    Sun,
    Moon
} from 'lucide-react';

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const { theme, toggleTheme } = useTheme();
    const { logout } = useAuth();

    // Fetch search results when query is long enough
    const { data: results = { notes: [], expenses: [], projects: [] }, isFetching } = useQuery({
        queryKey: ['global-search', query],
        queryFn: () => api.get('/search', { params: { q: query } }).then(res => res.data),
        enabled: query.length > 2,
        debounce: 300
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        const handleOpenEvent = () => setIsOpen(true);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('open-command-palette', handleOpenEvent);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('open-command-palette', handleOpenEvent);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        } else {
            setQuery('');
        }
    }, [isOpen]);

    const handleAction = (action) => {
        action();
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <div
                className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setIsOpen(false)}
            />

            <div className="relative w-full max-w-2xl bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200">
                <div className="flex items-center px-4 border-b border-border-subtle">
                    <Search className="text-text-secondary mr-3" size={20} />
                    <input
                        ref={inputRef}
                        className="flex-1 py-4 bg-transparent outline-none text-text-primary text-lg"
                        placeholder="Search journal, expenses, or projects... (Ctrl+K)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {isFetching && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    )}
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {query.length <= 2 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                            <div className="space-y-1">
                                <p className="px-2 py-1 text-[10px] uppercase font-bold text-text-secondary tracking-widest">Pages</p>
                                <button
                                    onClick={() => handleAction(() => navigate('/'))}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover text-sm text-text-primary transition-colors"
                                >
                                    <Calendar size={16} className="text-text-secondary" />
                                    <span>Dashboard</span>
                                </button>
                                <button
                                    onClick={() => handleAction(() => navigate('/tasks'))}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover text-sm text-text-primary transition-colors"
                                >
                                    <ListTodo size={16} className="text-text-secondary" />
                                    <span>Tasks</span>
                                </button>
                                <button
                                    onClick={() => handleAction(() => navigate('/journal'))}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover text-sm text-text-primary transition-colors"
                                >
                                    <PenTool size={16} className="text-text-secondary" />
                                    <span>Journal</span>
                                </button>
                                <button
                                    onClick={() => handleAction(() => navigate('/learning'))}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover text-sm text-text-primary transition-colors"
                                >
                                    <BookOpen size={16} className="text-text-secondary" />
                                    <span>Learning</span>
                                </button>
                                <button
                                    onClick={() => handleAction(() => navigate('/fitness'))}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover text-sm text-text-primary transition-colors"
                                >
                                    <Dumbbell size={16} className="text-text-secondary" />
                                    <span>Fitness</span>
                                </button>
                                <button
                                    onClick={() => handleAction(() => navigate('/projects'))}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover text-sm text-text-primary transition-colors"
                                >
                                    <Layers size={16} className="text-text-secondary" />
                                    <span>Projects</span>
                                </button>
                                <button
                                    onClick={() => handleAction(() => navigate('/expenses'))}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover text-sm text-text-primary transition-colors"
                                >
                                    <CreditCard size={16} className="text-text-secondary" />
                                    <span>Expenses</span>
                                </button>
                                <button
                                    onClick={() => handleAction(() => navigate('/vision'))}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover text-sm text-text-primary transition-colors"
                                >
                                    <Sparkles size={16} className="text-text-secondary" />
                                    <span>Vision Board</span>
                                </button>
                            </div>

                            <div className="space-y-1">
                                <p className="px-2 py-1 text-[10px] uppercase font-bold text-text-secondary tracking-widest">Actions</p>
                                <button
                                    onClick={() => handleAction(toggleTheme)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover text-sm text-text-primary transition-colors"
                                >
                                    {theme === 'dark' ? <Sun size={16} className="text-text-secondary" /> : <Moon size={16} className="text-text-secondary" />}
                                    <span>Toggle Theme</span>
                                </button>
                                <button
                                    onClick={() => handleAction(() => navigate('/profile'))}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover text-sm text-text-primary transition-colors"
                                >
                                    <User size={16} className="text-text-secondary" />
                                    <span>Profile</span>
                                </button>
                                <button
                                    onClick={() => handleAction(logout)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover text-sm text-accent transition-colors"
                                >
                                    <LogOut size={16} className="text-accent" />
                                    <span>Log Out</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-2 space-y-4">
                            {results.notes.length > 0 && (
                                <div>
                                    <p className="px-2 py-1 text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1">Journal Entries</p>
                                    {results.notes.map(note => (
                                        <button
                                            key={note.id}
                                            onClick={() => { navigate('/journal'); setIsOpen(false); }}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-hover group transition-colors"
                                        >
                                            <p className="text-sm text-text-primary line-clamp-1">{note.content}</p>
                                            <p className="text-[10px] text-text-secondary uppercase font-bold flex items-center gap-1 mt-0.5">
                                                <Calendar size={10} /> {note.date}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.expenses.length > 0 && (
                                <div>
                                    <p className="px-2 py-1 text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1">Expenses</p>
                                    {results.expenses.map(exp => (
                                        <button
                                            key={exp.id}
                                            onClick={() => { navigate('/expenses'); setIsOpen(false); }}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-hover group transition-colors"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm text-text-primary">{exp.description}</span>
                                                <span className="text-[10px] text-text-secondary uppercase font-bold flex items-center gap-1">
                                                    <Calendar size={10} /> {exp.date} • {exp.category}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-text-primary tabular-nums">₦{exp.amount.toFixed(2)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.projects.length > 0 && (
                                <div>
                                    <p className="px-2 py-1 text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1">Projects</p>
                                    {results.projects.map(proj => (
                                        <button
                                            key={proj.id}
                                            onClick={() => { navigate('/projects'); setIsOpen(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover transition-colors"
                                        >
                                            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                <Layers size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-text-primary">{proj.name}</p>
                                                <p className="text-[10px] text-text-secondary uppercase font-bold">Active Project</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.notes.length === 0 && results.expenses.length === 0 && results.projects.length === 0 && (
                                <div className="p-8 text-center">
                                    <Search className="mx-auto text-text-secondary/20 mb-3" size={40} />
                                    <p className="text-sm text-text-secondary italic">No results found for "{query}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-2 bg-hover/30 border-t border-border-subtle flex items-center justify-between text-[10px] uppercase font-bold text-text-secondary tracking-widest">
                    <div className="flex gap-4 px-2">
                        <span className="flex items-center gap-1"><ArrowRight size={10} /> Select</span>
                    </div>
                    <span className="px-2 gap-2 flex items-center">
                        <span className="bg-surface border border-border-subtle px-1 rounded">CTRL K</span>
                        <span>to toggle</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
