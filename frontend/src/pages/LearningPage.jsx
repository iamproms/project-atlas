import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import api from '../api/client';
import {
    Timer,
    Play,
    Pause,
    Square,
    BookOpen,
    Trash2,
    Plus,
    Clock,
    TrendingUp,
    Calendar,
    Target,
    Headphones,
    Volume2,
    Library,
    MoreVertical,
    CheckCircle2,
    Bookmark,
    Video,
    FileText,
    Layers,
    X
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { useTimer } from '../context/TimerContext';

const SOUNDS = {
    'Rain': 'https://www.soundjay.com/nature/sounds/rain-07.mp3',
    'White Noise': 'https://www.soundjay.com/misc/sounds/white-noise-01.mp3'
};

const RESOURCE_TYPES = {
    'Book': { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    'Course': { icon: Video, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    'Article': { icon: FileText, color: 'text-green-400', bg: 'bg-green-400/10' },
    'Project': { icon: Layers, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    'Other': { icon: Bookmark, color: 'text-slate-400', bg: 'bg-slate-400/10' }
};

export default function LearningPage() {
    const [activeTab, setActiveTab] = useState('focus'); // 'focus' | 'library'
    const today = startOfDay(new Date());

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default mb-2">
                        🧠
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">The Library</h1>
                    <p className="text-text-secondary text-sm">Knowledge acquisition and deep work.</p>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-surface border border-white/10 rounded-xl">
                    <button
                        onClick={() => setActiveTab('focus')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'focus' ? 'bg-primary text-background shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        <Timer size={16} />
                        Focus Studio
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'library' ? 'bg-primary text-background shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        <Library size={16} />
                        My Shelf
                    </button>
                </div>
            </div>

            {activeTab === 'focus' ? <FocusStudio /> : <LibraryShelf />}
        </div>
    );
}

function FocusStudio() {
    const today = startOfDay(new Date());
    const dateStr = format(today, 'yyyy-MM-dd');
    const queryClient = useQueryClient();

    // Global Timer State
    const {
        seconds,
        isActive: isTimerRunning,
        direction: timerDirection,
        startTimer,
        stopTimer,
        resetTimer,
        setCustomTime
    } = useTimer();

    // Local State
    const [subject, setSubject] = useState(''); // Legacy subject line
    const [selectedResourceId, setSelectedResourceId] = useState(''); // New linked resource
    const [mode, setMode] = useState('timer'); // 'timer' | 'manual' | 'feynman'
    const [manualDuration, setManualDuration] = useState('');
    const [takeaways, setTakeaways] = useState('');
    const [activeSound, setActiveSound] = useState(null);
    const audioRef = React.useRef(null);

    // Feynman State
    const [feynmanTopic, setFeynmanTopic] = useState('');
    const [feynmanExplanation, setFeynmanExplanation] = useState('');

    // Queries
    const { data: resources = [] } = useQuery({
        queryKey: ['resources'],
        queryFn: () => api.get('/resources/', { params: { status: 'active' } }).then(res => res.data)
    });

    const { data: sessions = [] } = useQuery({
        queryKey: ['learning', dateStr],
        queryFn: () => api.get(`/learning/${dateStr}`).then(res => res.data)
    });

    // Mutations
    const createSession = useMutation({
        mutationFn: (newSession) => api.post('/learning/', newSession),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['learning'] });
            resetTimer();
            setSubject('');
            setTakeaways('');
            // TODO: Prompt for progress update if resource was selected
        }
    });

    const deleteSession = useMutation({
        mutationFn: (id) => api.delete(`/learning/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learning'] })
    });

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleSound = (soundName) => {
        if (activeSound === soundName) {
            setActiveSound(null);
            audioRef.current?.pause();
        } else {
            setActiveSound(soundName);
            if (audioRef.current) {
                audioRef.current.src = SOUNDS[soundName];
                audioRef.current.play().catch(console.error);
            }
        }
    };

    const handleStopTimer = () => {
        if (seconds < 60) {
            if (!window.confirm("Session too short. Discard?")) return;
            resetTimer();
            return;
        }

        const linkedResource = resources.find(r => r.id === selectedResourceId);
        const sessionSubject = linkedResource ? linkedResource.title : (subject || "Focus Session");

        createSession.mutate({
            date: dateStr,
            subject: sessionSubject,
            resource_id: selectedResourceId || null,
            resource_type: linkedResource?.type,
            resource_name: linkedResource?.title,
            takeaways: takeaways,
            duration_minutes: Math.round(seconds / 60) // Logic depends on timer direction, simplifying for now
        });
    };

    const handleManualSubmit = () => {
        const linkedResource = resources.find(r => r.id === selectedResourceId);
        const sessionSubject = linkedResource ? linkedResource.title : (subject || "Manual Log");

        createSession.mutate({
            date: dateStr,
            subject: sessionSubject,
            resource_id: selectedResourceId || null,
            duration_minutes: parseInt(manualDuration) || 0,
            takeaways: takeaways
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Main Focus Area */}
                <section className={`p-8 md:p-12 rounded-[2rem] border transition-all duration-500 relative overflow-hidden ${isTimerRunning ? 'bg-black/40 border-primary/50 shadow-[0_0_50px_rgba(46,170,220,0.15)]' : 'bg-surface/30 border-white/5'}`}>
                    {/* Background Gradient */}
                    {isTimerRunning && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />}

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Mode Switcher */}
                        <div className="flex items-center justify-center gap-2 mb-12 bg-black/40 p-1 rounded-xl border border-white/10">
                            <button onClick={() => setMode('timer')} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${mode === 'timer' ? 'bg-primary text-background shadow-lg' : 'text-text-secondary hover:text-white'}`}>
                                <Timer size={14} /> Timer
                            </button>
                            <button onClick={() => setMode('feynman')} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${mode === 'feynman' ? 'bg-primary text-background shadow-lg' : 'text-text-secondary hover:text-white'}`}>
                                <Target size={14} /> Feynman
                            </button>
                            <button onClick={() => setMode('manual')} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${mode === 'manual' ? 'bg-primary text-background shadow-lg' : 'text-text-secondary hover:text-white'}`}>
                                <Clock size={14} /> Log
                            </button>
                        </div>

                        {mode === 'timer' && (
                            <>
                                <div className={`text-9xl font-mono font-bold mb-12 tabular-nums tracking-tighter transition-colors ${isTimerRunning ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-text-secondary/50'}`}>
                                    {formatTime(seconds)}
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-8 mb-12">
                                    {!isTimerRunning ? (
                                        <button onClick={() => startTimer(seconds, timerDirection)} className="w-24 h-24 rounded-full bg-primary text-background flex items-center justify-center hover:scale-110 transition-all shadow-[0_0_30px_rgba(46,170,220,0.4)]">
                                            <Play size={40} fill="currentColor" className="ml-2" />
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={stopTimer} className="w-20 h-20 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
                                                <Pause size={32} fill="currentColor" />
                                            </button>
                                            <button onClick={handleStopTimer} className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                                <Square size={32} fill="currentColor" />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Resource Linker */}
                                {!isTimerRunning && (
                                    <div className="w-full max-w-md space-y-4">
                                        <div className="relative">
                                            <select
                                                value={selectedResourceId}
                                                onChange={(e) => setSelectedResourceId(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary appearance-none focus:border-primary outline-none transition-all"
                                            >
                                                <option value="">-- No Linked Resource --</option>
                                                {resources.map(r => (
                                                    <option key={r.id} value={r.id}>{r.type === 'Book' ? '📖' : '🎓'} {r.title}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                                                <MoreVertical size={16} />
                                            </div>
                                        </div>
                                        {!selectedResourceId && (
                                            <input
                                                className="w-full bg-transparent text-center text-sm border-b border-white/10 py-2 focus:border-primary outline-none transition-colors"
                                                placeholder="Or type a custom subject..."
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                            />
                                        )}
                                        <div className="flex justify-center gap-2 pt-4">
                                            {[25, 45, 60].map(m => (
                                                <button key={m} onClick={() => setCustomTime(m)} className="px-3 py-1 rounded-full border border-white/10 text-xs font-bold text-text-secondary hover:text-primary hover:border-primary/50 transition-all">
                                                    {m}m
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {mode === 'manual' && (
                            <div className="w-full max-w-md space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <select
                                    value={selectedResourceId}
                                    onChange={(e) => setSelectedResourceId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-all"
                                >
                                    <option value="">-- Select Resource (Optional) --</option>
                                    {resources.map(r => (
                                        <option key={r.id} value={r.id}>{r.title}</option>
                                    ))}
                                </select>
                                {!selectedResourceId && (
                                    <input
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                                        placeholder="Subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                )}
                                <input
                                    type="number"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                                    placeholder="Duration (minutes)"
                                    value={manualDuration}
                                    onChange={(e) => setManualDuration(e.target.value)}
                                />
                                <button onClick={handleManualSubmit} className="w-full bg-primary text-background font-bold py-3 rounded-xl hover:brightness-110">
                                    Log Session
                                </button>
                            </div>
                        )}

                        {mode === 'feynman' && (
                            <div className="w-full max-w-xl space-y-6 text-left animate-in fade-in slide-in-from-right-4">
                                <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                                    <h3 className="font-bold text-primary mb-2 text-sm">1. Concept</h3>
                                    <input className="w-full bg-transparent text-xl font-bold border-b border-white/10 pb-2 focus:border-primary outline-none" placeholder="What requires understanding?" value={feynmanTopic} onChange={e => setFeynmanTopic(e.target.value)} />
                                </div>
                                <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                                    <h3 className="font-bold text-primary mb-2 text-sm">2. Explanation</h3>
                                    <textarea className="w-full bg-transparent text-sm text-text-secondary resize-none outline-none" rows={6} placeholder="Explain it simply..." value={feynmanExplanation} onChange={e => setFeynmanExplanation(e.target.value)} />
                                </div>
                                <button className="w-full py-3 bg-white/5 hover:bg-primary hover:text-background rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                                    Save to Journal
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Note Taking Area (Visible if timer running or post-session) */}
                <div className="bg-surface border border-white/5 rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4">Session Notes</h3>
                    <textarea
                        className="w-full bg-transparent text-sm text-text-primary resize-none outline-none min-h-[100px]"
                        placeholder="Capture your thoughts, key takeaways, or page numbers..."
                        value={takeaways}
                        onChange={(e) => setTakeaways(e.target.value)}
                    />
                </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
                {/* Sounds */}
                <section className="bg-surface border border-white/5 rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4 flex items-center gap-2">
                        <Headphones size={14} /> Soundscape
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.keys(SOUNDS).map(sound => (
                            <button
                                key={sound}
                                onClick={() => toggleSound(sound)}
                                className={`p-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${activeSound === sound ? 'bg-primary/10 border-primary text-primary' : 'bg-black/20 border-transparent hover:bg-white/5 text-text-secondary'}`}
                            >
                                {sound}
                                {activeSound === sound && <Volume2 size={12} className="animate-pulse" />}
                            </button>
                        ))}
                    </div>
                    <audio ref={audioRef} loop />
                </section>

                {/* Today's Log */}
                <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2 px-2">
                        <Calendar size={14} /> Today's Focus
                    </h3>
                    {sessions.map(s => (
                        <div key={s.id} className="bg-surface border border-white/5 rounded-xl p-4 flex justify-between items-center group">
                            <div>
                                <h4 className="font-bold text-sm text-text-primary">{s.subject}</h4>
                                <p className="text-xs text-text-secondary">{s.duration_minutes}m • {s.resource_type || 'General'}</p>
                            </div>
                            <button onClick={() => deleteSession.mutate(s.id)} className="text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {sessions.length === 0 && (
                        <div className="text-center py-8 text-xs text-text-secondary border border-dashed border-white/10 rounded-xl">
                            Ready to flow?
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function LibraryShelf() {
    const [isAdding, setIsAdding] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const queryClient = useQueryClient();

    const { data: resources = [] } = useQuery({
        queryKey: ['resources'],
        queryFn: () => api.get('/resources/').then(res => res.data)
    });

    const createResource = useMutation({
        mutationFn: (newResource) => api.post('/resources/', newResource),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            setIsAdding(false);
        }
    });

    const updateResource = useMutation({
        mutationFn: ({ id, data }) => api.patch(`/resources/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            setEditingResource(null);
        }
    });

    // Grouping
    const active = resources.filter(r => r.status === 'active');
    const backlog = resources.filter(r => r.status === 'backlog');
    const completed = resources.filter(r => r.status === 'completed');

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Active Shelf */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="w-2 h-8 bg-primary rounded-full"></span>
                        Current Reads & Courses
                    </h2>
                    <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 text-xs font-bold bg-primary text-background px-4 py-2 rounded-lg hover:brightness-110 transition-all">
                        <Plus size={14} /> ADD NEW
                    </button>
                </div>

                {isAdding && (
                    <AddResourceForm onClose={() => setIsAdding(false)} onSubmit={createResource.mutate} />
                )}

                {editingResource && (
                    <UpdateProgressModal
                        resource={editingResource}
                        onClose={() => setEditingResource(null)}
                        onSubmit={(data) => updateResource.mutate({ id: editingResource.id, data })}
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {active.map(r => (
                        <ResourceCard
                            key={r.id}
                            resource={r}
                            onUpdateClick={() => setEditingResource(r)}
                        />
                    ))}
                    {active.length === 0 && !isAdding && (
                        <div className="col-span-full py-12 text-center text-text-secondary border border-dashed border-white/10 rounded-2xl">
                            No active resources. Pick something from the backlog!
                        </div>
                    )}
                </div>
            </section>

            {/* Backlog */}
            <section>
                <h2 className="text-lg font-bold text-text-secondary mb-6 flex items-center gap-2">
                    <Layers size={18} /> Up Next
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {backlog.map(r => (
                        <ResourceCard
                            key={r.id}
                            resource={r}
                            compact
                            onUpdateClick={() => setEditingResource(r)}
                        />
                    ))}
                </div>
            </section>

            {/* Completed */}
            <section>
                <h2 className="text-lg font-bold text-text-secondary mb-6 flex items-center gap-2">
                    <CheckCircle2 size={18} /> Finished
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {completed.map(r => (
                        <ResourceCard
                            key={r.id}
                            resource={r}
                            compact
                            onUpdateClick={() => setEditingResource(r)}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

function ResourceCard({ resource, compact, onUpdateClick }) {
    const TypeIcon = RESOURCE_TYPES[resource.type]?.icon || Bookmark;
    const typeColor = RESOURCE_TYPES[resource.type]?.color || 'text-slate-400';
    const typeBg = RESOURCE_TYPES[resource.type]?.bg || 'bg-slate-400/10';
    const percent = Math.round((resource.current_progress / resource.total_progress) * 100) || 0;

    if (compact) {
        return (
            <div className="bg-surface border border-white/5 hover:border-white/10 p-4 rounded-xl transition-all group relative">
                <div className="flex justify-between items-start mb-2">
                    <div className={`p-1.5 rounded-lg ${typeBg} ${typeColor}`}>
                        <TypeIcon size={14} />
                    </div>
                </div>
                <h3 className="font-bold text-sm text-text-primary line-clamp-1">{resource.title}</h3>
                <p className="text-[10px] text-text-secondary mt-1">{resource.type} • {percent}%</p>

                {/* Overlay Button */}
                <button
                    onClick={onUpdateClick}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl"
                >
                    <span className="text-xs font-bold text-white border border-white/20 px-3 py-1 rounded-lg hover:bg-white hover:text-black transition-colors">
                        Update
                    </span>
                </button>
            </div>
        );
    }

    return (
        <div className="bg-surface border border-white/5 p-6 rounded-2xl hover:border-primary/20 transition-all group relative overflow-hidden">
            <div className="flex gap-4 items-start mb-6">
                <div className={`p-3 rounded-xl ${typeBg} ${typeColor}`}>
                    <TypeIcon size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-text-primary leading-tight mb-1">{resource.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="uppercase font-bold tracking-wider">{resource.type}</span>
                        <span>•</span>
                        <span>{resource.units === '%' ? `${percent}%` : `${resource.current_progress} / ${resource.total_progress} ${resource.units}`}</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-black/40 rounded-full overflow-hidden mb-4">
                <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${percent === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${percent}%` }}
                />
            </div>

            <div className="flex justify-between items-end">
                <button
                    onClick={onUpdateClick}
                    className="text-xs font-bold text-text-secondary hover:text-primary transition-colors"
                >
                    Update Progress
                </button>
                <div className="text-2xl font-bold text-white/10 group-hover:text-white/20 transition-colors">
                    {percent}%
                </div>
            </div>
        </div>
    );
}

function UpdateProgressModal({ resource, onClose, onSubmit }) {
    const [progress, setProgress] = useState(resource.current_progress);
    const [status, setStatus] = useState(resource.status);

    // Auto-complete if progress >= total
    const handleProgressChange = (val) => {
        const valInt = parseInt(val) || 0;
        setProgress(valInt);
        if (valInt >= resource.total_progress && status !== 'completed') {
            setStatus('completed');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ current_progress: progress, status });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface border border-white/10 p-6 rounded-2xl w-full max-w-sm relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white"><X size={18} /></button>

                <h3 className="font-bold text-lg mb-1">Update Progress</h3>
                <p className="text-xs text-text-secondary mb-6">{resource.title}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">
                            Current Progress ({resource.units})
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-primary text-xl font-bold"
                                value={progress}
                                onChange={e => handleProgressChange(e.target.value)}
                                min="0"
                                max={resource.units === '%' ? 100 : undefined}
                                autoFocus
                            />
                            <span className="text-text-secondary font-bold">/ {resource.total_progress}</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Status</label>
                        <select
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-primary"
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                        >
                            <option value="active">Active</option>
                            <option value="backlog">Up Next</option>
                            <option value="completed">Completed</option>
                            <option value="dropped">Dropped</option>
                        </select>
                    </div>

                    <div className="pt-2">
                        <button type="submit" className="w-full py-3 bg-primary text-background rounded-xl font-bold hover:brightness-110">
                            Save Progress
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddResourceForm({ onClose, onSubmit }) {
    const [form, setForm] = useState({
        title: '',
        type: 'Book',
        status: 'active',
        total_progress: 100,
        units: 'pages' // or '%' or 'chapters'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <div className="bg-surface border border-white/10 p-6 rounded-2xl mb-8 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Add to Library</h3>
                <button onClick={onClose} className="text-text-secondary hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Title</label>
                    <input
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-primary"
                        required
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        autoFocus
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Type</label>
                    <select
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-primary"
                        value={form.type}
                        onChange={e => setForm({ ...form, type: e.target.value })}
                    >
                        {Object.keys(RESOURCE_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Status</label>
                    <select
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-primary"
                        value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value })}
                    >
                        <option value="active">Active (Reading/Taking)</option>
                        <option value="backlog">Up Next (Queue)</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Total Length</label>
                    <input
                        type="number"
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-primary"
                        value={form.total_progress}
                        onChange={e => setForm({ ...form, total_progress: parseInt(e.target.value) })}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Units</label>
                    <select
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-primary"
                        value={form.units}
                        onChange={e => setForm({ ...form, units: e.target.value })}
                    >
                        <option value="pages">Pages</option>
                        <option value="%">%</option>
                        <option value="chapters">Chapters</option>
                        <option value="hours">Hours</option>
                    </select>
                </div>
                <div className="md:col-span-2 pt-4 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-text-secondary hover:text-white">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-primary text-background rounded-lg font-bold hover:brightness-110">Add Resource</button>
                </div>
            </form>
        </div>
    );
}
