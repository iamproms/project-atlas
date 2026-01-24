import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import {
    Timer,
    Play,
    Pause,
    Square,
    BookOpen,
    ExternalLink,
    Trash2,
    Plus,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';

export default function LearningWidget({ dateStr }) {
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [subject, setSubject] = useState('');
    const [resourceType, setResourceType] = useState('Course');
    const [resourceName, setResourceName] = useState('');
    const [takeaways, setTakeaways] = useState('');
    const [isAddingManually, setIsAddingManually] = useState(false);

    // Manual form state
    const [manualMinutes, setManualMinutes] = useState('');
    const [manualSubject, setManualSubject] = useState('');

    const queryClient = useQueryClient();

    const { data: sessions = [] } = useQuery({
        queryKey: ['learning', dateStr],
        queryFn: () => api.get(`/learning/${dateStr}`).then(res => res.data)
    });

    useEffect(() => {
        let interval = null;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const createSession = useMutation({
        mutationFn: (newSession) => api.post('/learning/', newSession),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['learning'] });
            setSeconds(0);
            setIsTimerRunning(false);
            setSubject('');
            setResourceName('');
            setTakeaways('');
        }
    });

    const deleteSession = useMutation({
        mutationFn: (id) => api.delete(`/learning/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learning'] })
    });

    const handleStopTimer = () => {
        if (seconds < 60) {
            if (!window.confirm("Session is less than a minute. Discard?")) return;
            setIsTimerRunning(false);
            setSeconds(0);
            return;
        }

        createSession.mutate({
            date: dateStr,
            subject: subject || "General Learning",
            resource_type: resourceType,
            resource_name: resourceName,
            takeaways: takeaways,
            duration_minutes: Math.round(seconds / 60)
        });
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualSubject || !manualMinutes) return;
        createSession.mutate({
            date: dateStr,
            subject: manualSubject,
            duration_minutes: parseInt(manualMinutes)
        });
    };

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    return (
        <section className="animate-in fade-in duration-500">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary/60 mb-6 flex items-center gap-2">
                <span>Learning & Focus</span>
                <div className="h-px flex-1 bg-border-subtle" />
                <span className="text-text-primary tabular-nums">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span>
            </h2>

            <div className="space-y-6">
                {/* Focus Timer Card */}
                <div className={`p-6 rounded-xl border transition-all duration-300 ${isTimerRunning ? 'bg-primary/5 border-primary/30 shadow-[0_0_20px_rgba(46,170,220,0.1)]' : 'bg-surface/30 border-border-subtle'}`}>
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] uppercase font-bold text-text-secondary tracking-[0.2em] mb-4">Deep Work Session</p>
                        <div className="text-5xl font-mono font-bold text-text-primary mb-8 tabular-nums tracking-tighter">
                            {formatTime(seconds)}
                        </div>

                        <div className="flex items-center gap-4">
                            {!isTimerRunning ? (
                                <button
                                    onClick={() => setIsTimerRunning(true)}
                                    className="w-12 h-12 rounded-full bg-primary text-background flex items-center justify-center hover:scale-105 transition-all shadow-lg"
                                >
                                    <Play size={20} fill="currentColor" />
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsTimerRunning(false)}
                                        className="w-12 h-12 rounded-full bg-surface border border-border-subtle text-text-primary flex items-center justify-center hover:bg-hover transition-all"
                                    >
                                        <Pause size={20} fill="currentColor" />
                                    </button>
                                    <button
                                        onClick={handleStopTimer}
                                        className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center hover:scale-105 transition-all shadow-lg"
                                    >
                                        <Square size={20} fill="currentColor" />
                                    </button>
                                </>
                            )}
                        </div>

                        {isTimerRunning && (
                            <div className="mt-6 w-full space-y-3 animate-in fade-in slide-in-from-top-2">
                                <input
                                    className="bg-transparent text-center text-sm text-text-primary placeholder:text-text-secondary/30 outline-none w-full border-b border-transparent focus:border-primary/30 py-1 transition-all"
                                    placeholder="What are you focusing on?"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={resourceType}
                                        onChange={(e) => setResourceType(e.target.value)}
                                        className="bg-surface/50 border border-border-subtle rounded-lg px-2 py-1.5 text-[10px] text-text-primary outline-none focus:border-primary transition-all shadow-inner"
                                    >
                                        <option value="Course">🎓 Course</option>
                                        <option value="Book">📖 Book</option>
                                        <option value="Podcast">🎙️ Podcast</option>
                                        <option value="Video">🎬 Video</option>
                                    </select>
                                    <input
                                        className="bg-surface/50 border border-border-subtle rounded-lg px-2 py-1.5 text-[10px] text-text-primary outline-none focus:border-primary transition-all shadow-inner"
                                        placeholder="Name"
                                        value={resourceName}
                                        onChange={(e) => setResourceName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Session List */}
                <div className="space-y-2">
                    {sessions.map(session => (
                        <div key={session.id} className="group flex items-center justify-between py-2 px-3 bg-surface/20 rounded-lg border border-transparent hover:border-border-subtle transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded bg-primary/10 text-primary">
                                    <BookOpen size={14} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-text-primary">{session.subject}</p>
                                    <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">
                                        {session.resource_name ? `${session.resource_name} • ` : ''}{session.duration_minutes} minutes
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => deleteSession.mutate(session.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-text-secondary hover:text-accent transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    {!isAddingManually ? (
                        <button
                            onClick={() => setIsAddingManually(true)}
                            className="w-full py-2 flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest text-text-secondary hover:text-text-primary transition-all"
                        >
                            <Plus size={12} />
                            <span>Add Session Manually</span>
                        </button>
                    ) : (
                        <form onSubmit={handleManualSubmit} className="bg-surface/30 p-4 rounded border border-border-subtle animate-in slide-in-from-top-2">
                            <div className="space-y-3">
                                <input
                                    className="w-full notion-input text-sm"
                                    placeholder="Subject"
                                    value={manualSubject}
                                    onChange={(e) => setManualSubject(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        className="flex-1 notion-input text-sm"
                                        placeholder="Minutes"
                                        value={manualMinutes}
                                        onChange={(e) => setManualMinutes(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={createSession.isPending}
                                        className="bg-primary text-background px-4 py-1.5 rounded text-xs font-bold"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingManually(false)}
                                        className="px-3 text-xs font-semibold text-text-secondary"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
}
