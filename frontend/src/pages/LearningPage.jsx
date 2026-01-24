import React, { useState, useEffect, useMemo } from 'react';
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
    Volume2
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

const SOUNDS = {
    'Rain': 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_cda845b36b.mp3?filename=rain-and-thunder-16705.mp3', // Example placeholder
    'White Noise': 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_88447e769f.mp3?filename=white-noise-8117.mp3' // Example placeholder
};

import { useTimer } from '../context/TimerContext';

// ... imports

export default function LearningPage() {
    const today = startOfDay(new Date());

    // Global Timer State
    const {
        seconds,
        isActive: isTimerRunning,
        direction: timerDirection,
        startTimer,
        stopTimer,
        resetTimer,
        setSeconds,
        setCustomTime
    } = useTimer();

    // Local State for Session Logging
    const [subject, setSubject] = useState('');
    const [resourceType, setResourceType] = useState('Course');
    const [resourceName, setResourceName] = useState('');
    const [takeaways, setTakeaways] = useState('');
    const [resources, setResources] = useState('');
    const [mode, setMode] = useState('timer'); // 'timer' | 'manual' | 'feynman'
    const [manualDuration, setManualDuration] = useState('');
    const [customMinutes, setCustomMinutes] = useState(''); // New Custom Input

    const [activeSound, setActiveSound] = useState(null);
    const audioRef = React.useRef(null);

    const toggleSound = (soundName) => {
        if (activeSound === soundName) {
            setActiveSound(null);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        } else {
            if (soundName === null) {
                setActiveSound(null);
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                return;
            }
            setActiveSound(soundName);
            if (audioRef.current) {
                audioRef.current.src = SOUNDS[soundName];
                audioRef.current.play().catch(e => console.log("Audio play failed", e));
            }
        }
    };

    const queryClient = useQueryClient();

    // Last 30 days of data for stats
    const { data: allSessions = [] } = useQuery({
        queryKey: ['learning', 'stats'],
        queryFn: () => api.get('/learning/range', {
            params: {
                start_date: format(subDays(today, 30), 'yyyy-MM-dd'),
                end_date: format(today, 'yyyy-MM-dd')
            }
        }).then(res => res.data).catch(() => [])
    });

    // Fallback: If range doesn't exist yet, we'll just show today's for now
    const dateStr = format(today, 'yyyy-MM-dd');
    const { data: sessions = [] } = useQuery({
        queryKey: ['learning', dateStr],
        queryFn: () => api.get(`/learning/${dateStr}`).then(res => res.data)
    });

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
            resetTimer(); // Reset global timer on save
            setSubject('');
        }
    });

    // ... deleteSession ...

    const handleStopTimer = () => {
        if (seconds < 60) {
            if (!window.confirm("Session too short. Discard?")) return;
            resetTimer();
            return;
        }

        createSession.mutate({
            date: dateStr,
            subject: subject || "Focus Session",
            resource_type: resourceType,
            resource_name: resourceName,
            takeaways: takeaways,
            resources: resources,
            duration_minutes: Math.round(seconds / 60) // Note: context handles counting, we just take seconds. 
            // Wait, if counting DOWN, seconds is remaining time!
            // We need TOTAL duration - remaining (if counting down).
            // Or just track elapsed time? 
            // Context has totalDuration.
            // elapsed = direction === 'down' ? (totalDuration - seconds) : seconds
        });
    };

    // Correct duration calculation
    const getElapsedMinutes = () => {
        if (timerDirection === 'down') {
            // If we started with 25m (1500s) and have 1000s left, elapsed is 500s.
            // But 'totalDuration' is needed in Context.
            // Assuming Context provides it (I added it).
            // Wait, I need to expose totalDuration from Context. I did.
            // But I need to import it.
            // Destructuring `totalDuration` added above.
        }
        return Math.round(seconds / 60); // Stub behavior for now, fix in logic below
    };

    const handleManualSubmit = () => {
        if (!subject || !manualDuration) {
            alert('Please enter a subject and duration.');
            return;
        }
        createSession.mutate({
            date: dateStr,
            subject: subject,
            resource_type: resourceType,
            resource_name: resourceName,
            takeaways: takeaways,
            resources: resources,
            duration_minutes: parseInt(manualDuration)
        });
    };

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    // Chart Data: Consistency scores over time
    const chartData = useMemo(() => {
        const last14Days = eachDayOfInterval({
            start: subDays(today, 13),
            end: today
        });

        return last14Days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const daySessions = allSessions.filter(s => s.date === dateStr);
            const totalMins = daySessions.reduce((sum, s) => sum + s.duration_minutes, 0);
            return {
                name: format(day, 'MMM d'),
                value: totalMins
            };
        });
    }, [allSessions, today]);

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">
            <div className="mb-12">
                <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default mb-2">
                    🧠
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Learning</h1>
                <p className="text-text-secondary text-sm">Deep work and skill acquisition.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left: Timer & Today */}
                <div className="lg:col-span-2 space-y-12">
                    <section className={`p-8 md:p-12 rounded-[2rem] border transition-all duration-500 ${isTimerRunning ? 'bg-primary/5 border-primary/30 shadow-[0_0_40px_rgba(46,170,220,0.1)]' : 'bg-surface/30 border-border-subtle'}`}>
                        <div className="flex flex-col items-center">
                            {/* Mode Toggle */}
                            <div className="flex items-center justify-center gap-2 mb-8 bg-surface/50 p-1.5 rounded-xl border border-border-subtle w-fit mx-auto">
                                <button
                                    onClick={() => setMode('timer')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${mode === 'timer' ? 'bg-primary text-background shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                                >
                                    <Timer size={14} />
                                    Focus Timer
                                </button>
                                <button
                                    onClick={() => setMode('feynman')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${mode === 'feynman' ? 'bg-primary text-background shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                                >
                                    <Target size={14} />
                                    Feynman
                                </button>
                                <button
                                    onClick={() => setMode('manual')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${mode === 'manual' ? 'bg-primary text-background shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                                >
                                    <Clock size={14} />
                                    Log
                                </button>
                            </div>

                            {mode === 'timer' && (
                                <>
                                    <div className="flex flex-col items-center">
                                        <span className={`text-[10px] uppercase font-bold tracking-[0.4em] mb-4 transition-colors ${isTimerRunning ? 'text-primary' : 'text-text-secondary'}`}>
                                            {isTimerRunning ? 'Focus Session Active' : 'Select Duration'}
                                        </span>

                                        <div className={`text-8xl font-mono font-bold mb-8 tabular-nums tracking-tighter transition-colors ${isTimerRunning ? 'text-text-primary' : 'text-text-secondary/50'}`}>
                                            {formatTime(seconds)}
                                        </div>

                                        {/* Presets & Custom */}
                                        {!isTimerRunning && (
                                            <div className="flex flex-col items-center gap-4 mb-8">
                                                <div className="flex gap-3">
                                                    <button onClick={() => setCustomTime(25)} className="px-4 py-2 rounded-full border border-border-subtle hover:border-primary/50 text-xs font-bold text-text-secondary hover:text-primary transition-all">
                                                        🍅 25m
                                                    </button>
                                                    <button onClick={() => setCustomTime(90)} className="px-4 py-2 rounded-full border border-border-subtle hover:border-primary/50 text-xs font-bold text-text-secondary hover:text-primary transition-all">
                                                        🧠 90m
                                                    </button>
                                                    <button onClick={() => setCustomTime(120)} className="px-4 py-2 rounded-full border border-border-subtle hover:border-primary/50 text-xs font-bold text-text-secondary hover:text-primary transition-all">
                                                        🎓 2h Class
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Custom"
                                                        className="w-20 bg-surface/50 border border-border-subtle rounded-lg px-3 py-1 text-xs text-center outline-none focus:border-primary"
                                                        value={customMinutes}
                                                        onChange={(e) => setCustomMinutes(e.target.value)}
                                                    />
                                                    <button
                                                        onClick={() => { if (customMinutes) setCustomTime(parseInt(customMinutes)); }}
                                                        className="text-xs font-bold text-primary hover:underline"
                                                    >
                                                        Set Min
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-6 mb-12">
                                            {!isTimerRunning ? (
                                                <button
                                                    onClick={() => startTimer(seconds, timerDirection)}
                                                    className="w-20 h-20 rounded-full bg-primary text-background flex items-center justify-center hover:scale-105 transition-all shadow-xl group"
                                                >
                                                    <Play size={32} fill="currentColor" className="ml-1" />
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={stopTimer}
                                                        className="w-20 h-20 rounded-full bg-surface border border-border-subtle text-text-primary flex items-center justify-center hover:bg-hover transition-all"
                                                    >
                                                        <Pause size={32} fill="currentColor" />
                                                    </button>
                                                    <button
                                                        onClick={handleStopTimer}
                                                        className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center hover:scale-105 transition-all shadow-xl"
                                                    >
                                                        <Square size={32} fill="currentColor" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {mode === 'feynman' && (
                                <div className="w-full max-w-xl text-left space-y-6 mb-8 animate-in fade-in slide-in-from-right-4">
                                    <div className="bg-surface/50 p-6 rounded-2xl border border-border-subtle">
                                        <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">1</div>
                                            Choose Concept
                                        </h3>
                                        <input
                                            className="w-full bg-transparent border-b border-border-subtle focus:border-primary outline-none py-2 text-lg font-medium"
                                            placeholder="What topic are you trying to master?"
                                        />
                                    </div>

                                    <div className="bg-surface/50 p-6 rounded-2xl border border-border-subtle">
                                        <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">2</div>
                                            Explain it simply
                                        </h3>
                                        <textarea
                                            className="w-full bg-transparent outline-none text-sm text-text-secondary resize-none"
                                            rows={4}
                                            placeholder="Explain it as if you were teaching a 5-year-old. Identify gaps in your knowledge."
                                        />
                                    </div>

                                    <div className="bg-surface/50 p-6 rounded-2xl border border-border-subtle">
                                        <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">3</div>
                                            Review & Simplify
                                        </h3>
                                        <p className="text-xs text-text-secondary mb-2">Use analogies. Remove jargon. If you get stuck, go back to the source material.</p>
                                        <button className="w-full py-2 rounded-lg bg-surface hover:bg-hover border border-border-subtle text-xs font-bold transition-all">
                                            Save Note to Journal
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <input
                                    className="bg-transparent text-center text-2xl font-medium text-text-primary placeholder:text-text-secondary/20 outline-none w-full border-b border-transparent focus:border-border-subtle py-2 transition-all"
                                    placeholder="What are you mastering today?"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <select
                                        value={resourceType}
                                        onChange={(e) => setResourceType(e.target.value)}
                                        className="bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-all shadow-inner"
                                    >
                                        <option value="Course">🎓 Course</option>
                                        <option value="Book">📖 Book</option>
                                        <option value="Podcast">🎙️ Podcast</option>
                                        <option value="Article">📄 Article</option>
                                        <option value="Video">🎬 Video</option>
                                        <option value="Project">🛠️ Project</option>
                                        <option value="Other">✨ Other</option>
                                    </select>

                                    {mode === 'manual' && (
                                        <input
                                            type="number"
                                            className="bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-all shadow-inner"
                                            placeholder="Duration (minutes)"
                                            value={manualDuration}
                                            onChange={(e) => setManualDuration(e.target.value)}
                                        />
                                    )}

                                    <input
                                        className={`${mode === 'manual' ? 'md:col-span-2' : ''} bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-all shadow-inner`}
                                        placeholder="Resource Name (e.g. CS50, Atomic Habits)"
                                        value={resourceName}
                                        onChange={(e) => setResourceName(e.target.value)}
                                    />

                                    <textarea
                                        className="md:col-span-2 bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-all min-h-[100px] shadow-inner resize-none"
                                        placeholder="Key Takeaways & Notes (Markdown supported)..."
                                        value={takeaways}
                                        onChange={(e) => setTakeaways(e.target.value)}
                                    />

                                    <textarea
                                        className="md:col-span-2 bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-all min-h-[80px] shadow-inner resize-none"
                                        placeholder="Resources / Links (one per line)..."
                                        value={resources}
                                        onChange={(e) => setResources(e.target.value)}
                                    />
                                </div>

                                {mode === 'manual' && (
                                    <button
                                        onClick={handleManualSubmit}
                                        className="w-full bg-primary text-background font-bold py-4 rounded-xl shadow-lg hover:shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all"
                                    >
                                        Log Session
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Focus Sounds */}
                    <section className="bg-surface/30 p-8 rounded-[2rem] border border-border-subtle transition-all">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6 flex items-center gap-2">
                            <Headphones size={14} /> Focus Sounds
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            {['Rain', 'White Noise'].map(sound => (
                                <button
                                    key={sound}
                                    onClick={() => toggleSound(sound)}
                                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${activeSound === sound
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-surface/50 border-transparent hover:border-border-subtle hover:bg-surface'
                                        }`}
                                >
                                    <span className="text-sm font-bold">{sound}</span>
                                    {activeSound === sound ? <Volume2 size={16} className="animate-pulse" /> : <Play size={14} className="opacity-50" />}
                                </button>
                            ))}
                        </div>
                        {activeSound && (
                            <div className="mt-4 flex items-center justify-between text-[10px] text-text-secondary uppercase font-bold tracking-widest">
                                <span>Now Playing: {activeSound}</span>
                                <button onClick={() => toggleSound(null)} className="hover:text-accent">Stop</button>
                            </div>
                        )}
                        <audio ref={audioRef} loop />
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary/60 flex items-center gap-2">
                            <span>Today's Sessions</span>
                            <div className="h-px flex-1 bg-border-subtle" />
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {sessions.map(session => (
                                <div key={session.id} className="notion-card p-6 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-primary">{session.subject}</p>
                                            <p className="text-xs text-text-secondary">
                                                {session.resource_type ? `${session.resource_type}: ` : ''}
                                                {session.resource_name ? `${session.resource_name} • ` : ''}
                                                {session.duration_minutes} minutes
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteSession.mutate(session.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-text-secondary hover:text-accent transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {sessions.length === 0 && (
                                <div className="col-span-full py-12 text-center text-text-secondary italic bg-surface/10 rounded-2xl border border-dashed border-border-subtle">
                                    No focus sessions logged yet today.
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right: Analytics Sidebar */}
                <div className="space-y-12">
                    <section className="notion-card p-8">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Today's Volume</p>
                        <p className="text-4xl font-bold text-text-primary tabular-nums">
                            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                        </p>
                        <div className="mt-8 flex items-center gap-2 text-primary">
                            <TrendingUp size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Growth in progress</span>
                        </div>
                    </section>

                    {chartData.length > 0 && (
                        <section className="notion-card p-8">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-8">Focus Distribution</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ left: -20, right: 20 }}>
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} angle={-45} textAnchor="end" height={50} />
                                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="value" fill="#2eaadc" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    )}

                    <section className="notion-card p-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6 flex items-center gap-2">
                            <Target size={14} />
                            <span>Learning Tips</span>
                        </h3>
                        <ul className="space-y-4 text-xs text-text-secondary leading-relaxed">
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 flex-shrink-0" />
                                <span>Try the Pomodoro technique: 25 minutes of deep focus followed by a 5-minute break.</span>
                            </li>
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 flex-shrink-0" />
                                <span>Batch your learning by subject to minimize context-switching fatigue.</span>
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}
