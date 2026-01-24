import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, addDays, startOfDay } from 'date-fns';
import api from '../api/client';
import {
    Smile,
    Meh,
    Frown,
    Sun,
    Cloud,
    Tag,
    Star,
    Save,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Trash2,
    ArrowRight,
    BookOpen,
    History,
    FileSearch, // Use FileSearch instead of Search if preferred, or just Search
    Search,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { formatDateForAPI, formatDisplayDate } from '../utils/date';

const MOODS = [
    { label: 'Great', value: 'great', icon: Smile, color: 'text-primary' },
    { label: 'Neutral', value: 'neutral', icon: Meh, color: 'text-text-secondary' },
    { label: 'Down', value: 'down', icon: Frown, color: 'text-accent' },
];

export default function JournalPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const dateStr = formatDateForAPI(selectedDate);
    const queryClient = useQueryClient();

    const { data: note = { content: '', mood: '', highlight: '', lowlight: '', tags: '' }, isLoading } = useQuery({
        queryKey: ['note', dateStr],
        queryFn: () => api.get(`/daily-notes/${dateStr}`).then(res => res.data).catch(() => ({ content: '', mood: '', highlight: '', lowlight: '', tags: '' }))
    });

    const { data: recentNotes = [] } = useQuery({
        queryKey: ['notes', 'recent'],
        queryFn: () => api.get('/daily-notes/').then(res => res.data)
    });

    const [content, setContent] = useState('');
    const [mood, setMood] = useState('');
    const [highlight, setHighlight] = useState('');
    const [lowlight, setLowlight] = useState('');
    const [tags, setTags] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isZenMode, setIsZenMode] = useState(false);

    const filteredHistory = recentNotes.filter(n =>
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (note) {
            setContent(note.content || '');
            setMood(note.mood || '');
            setHighlight(note.highlight || '');
            setLowlight(note.lowlight || '');
            setTags(note.tags || '');
        }
    }, [note]);

    const saveNote = useMutation({
        mutationFn: (data) => api.put(`/daily-notes/${data.date}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['note', dateStr] });
            // Show a temporary success state could be nice
        }
    });

    const handleAutoSave = () => {
        saveNote.mutate({
            date: dateStr,
            content,
            mood,
            highlight,
            lowlight,
            tags
        });
    };

    // Manual Save for confidence
    const handleSave = (e) => {
        e.preventDefault();
        handleAutoSave();
    };

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">
            <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default">
                            📓
                        </div>
                        <button
                            onClick={() => setIsZenMode(!isZenMode)}
                            className="bg-surface border border-border-subtle p-2 rounded-xl text-text-secondary hover:text-primary transition-all"
                            title="Toggle Zen Mode"
                        >
                            {isZenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Journal</h1>
                    <p className="text-text-secondary text-sm">Reflection, gratitude, and internal ledger.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-surface/30 p-2 rounded-2xl border border-border-subtle">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                            className="p-2 hover:bg-hover rounded-xl text-text-secondary transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="px-4 py-1 text-sm font-bold text-text-primary flex items-center gap-2">
                            <Calendar size={16} className="text-primary" />
                            {formatDisplayDate(selectedDate)}
                        </div>
                        <button
                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                            className="p-2 hover:bg-hover rounded-xl text-text-secondary transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <div className="h-4 w-px bg-border-subtle hidden sm:block" />
                    <input
                        type="date"
                        value={dateStr}
                        onChange={(e) => e.target.value && setSelectedDate(new Date(e.target.value))}
                        className="bg-transparent text-xs font-bold uppercase text-text-secondary outline-none px-2 cursor-pointer hover:text-primary transition-colors"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main reflective content */}
                <div className={`transition-all duration-700 ${isZenMode ? 'fixed inset-0 z-50 bg-background flex flex-col items-center justify-center overflow-y-auto' : 'lg:col-span-2 space-y-8'}`}>
                    <section className={`transition-all duration-700 ${isZenMode ? 'w-full max-w-3xl p-12 min-h-screen' : 'bg-surface/30 p-8 rounded-[2rem] border border-border-subtle shadow-sm animate-in fade-in duration-500'}`}>
                        {isZenMode && (
                            <button
                                onClick={() => setIsZenMode(false)}
                                className="fixed top-6 right-6 p-4 rounded-full bg-surface shadow-lg text-text-secondary hover:text-text-primary transition-all z-50 opacity-50 hover:opacity-100"
                            >
                                <Minimize2 size={24} />
                            </button>
                        )}

                        <textarea
                            className={`w-full bg-transparent text-text-primary placeholder:text-text-secondary/20 outline-none resize-none leading-relaxed font-serif transition-all ${isZenMode
                                ? 'text-2xl md:text-3xl min-h-[80vh] pt-24'
                                : 'text-lg min-h-[500px]'
                                }`}
                            placeholder="Dear Atlas, today was..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onBlur={handleAutoSave}
                            autoFocus={isZenMode}
                        />

                        {!isZenMode && (
                            <div className="mt-8 pt-8 border-t border-border-subtle flex items-center justify-between">
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">
                                    <Save size={12} />
                                    <span>{saveNote.isPending ? 'Syncing...' : 'Saved to ledger'}</span>
                                </div>
                                <button
                                    onClick={handleSave}
                                    className="bg-primary text-background px-6 py-2 rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    Force Sync
                                </button>
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar: Structured insights */}
                <div className="space-y-8">
                    {/* Mood Tracking */}
                    <section className="notion-card p-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6">How was your day?</h3>
                        <div className="flex justify-between gap-4">
                            {MOODS.map(m => {
                                const Icon = m.icon;
                                const isSelected = mood === m.value;
                                return (
                                    <button
                                        key={m.value}
                                        onClick={() => { setMood(m.value); saveNote.mutate({ ...note, mood: m.value, date: dateStr, content }); }}
                                        className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border ${isSelected
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-surface/30 border-border-subtle hover:border-text-secondary text-text-secondary'
                                            }`}
                                    >
                                        <Icon size={24} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Highlights & Lowlights */}
                    <section className="notion-card p-8 space-y-8">
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                                <Sun size={14} /> Daily Highlight
                            </h3>
                            <input
                                className="w-full bg-transparent border-b border-border-subtle py-2 text-sm text-text-primary outline-none focus:border-primary transition-all placeholder:text-text-secondary/20"
                                placeholder="The best thing that happened..."
                                value={highlight}
                                onChange={(e) => setHighlight(e.target.value)}
                                onBlur={handleAutoSave}
                            />
                        </div>

                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
                                <Cloud size={14} /> Daily Challenge
                            </h3>
                            <input
                                className="w-full bg-transparent border-b border-border-subtle py-2 text-sm text-text-primary outline-none focus:border-accent/40 transition-all placeholder:text-text-secondary/20"
                                placeholder="What was difficult?"
                                value={lowlight}
                                onChange={(e) => setLowlight(e.target.value)}
                                onBlur={handleAutoSave}
                            />
                        </div>
                    </section>

                    {/* Tags */}
                    <section className="notion-card p-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4 flex items-center gap-2">
                            <Tag size={14} /> Tags
                        </h3>
                        <input
                            className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-primary outline-none focus:border-primary transition-all"
                            placeholder="family, win, travel..."
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            onBlur={handleAutoSave}
                        />
                        <p className="mt-4 text-[10px] text-text-secondary leading-relaxed opacity-60">
                            Tags help Atlas connect patterns in your life over time.
                        </p>
                    </section>

                    {/* Learning Link */}
                    <section className="p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10">
                        <BookOpen size={24} className="text-primary mb-4" />
                        <h3 className="text-sm font-bold text-text-primary mb-2">Deep Work Insight</h3>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            You logged 45 minutes of learning today. Reflection often leads to better retention.
                        </p>
                    </section>

                    {/* Journal History */}
                    <section className="notion-card p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                <History size={14} /> History
                            </h3>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-[10px] text-text-secondary hover:text-primary transition-colors"
                            >
                                Reset
                            </button>
                        </div>

                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/40" size={12} />
                            <input
                                className="w-full bg-surface/50 border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-[10px] text-text-primary outline-none focus:border-primary transition-all shadow-inner"
                                placeholder="Search past logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                            {filteredHistory.length === 0 ? (
                                <p className="text-[10px] text-text-secondary italic text-center py-4">No matching entries found.</p>
                            ) : (
                                filteredHistory.map(rn => (
                                    <button
                                        key={rn.id}
                                        onClick={() => setSelectedDate(new Date(rn.date))}
                                        className={`w-full text-left p-3 rounded-xl transition-all border ${format(new Date(rn.date), 'yyyy-MM-dd') === dateStr
                                            ? 'bg-primary/10 border-primary/30'
                                            : 'bg-surface/30 border-transparent hover:border-border-subtle'
                                            }`}
                                    >
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">
                                            {formatDisplayDate(new Date(rn.date))}
                                        </p>
                                        <p className="text-xs text-text-primary line-clamp-2 opacity-80 group-hover:opacity-100 italic">
                                            {rn.content.substring(0, 80)}...
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
