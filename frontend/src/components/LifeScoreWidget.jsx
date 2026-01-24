import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Trophy, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function LifeScoreWidget({ dateStr }) {
    // 1. Fetch Habits Logs
    const { data: habitLogs = [] } = useQuery({
        queryKey: ['logs', dateStr],
        queryFn: () => api.get(`/habits/logs/${dateStr}`).then(res => res.data)
    });

    const { data: habits = [] } = useQuery({
        queryKey: ['habits'],
        queryFn: () => api.get('/habits/').then(res => res.data)
    });

    // 2. Fetch Todos
    const { data: todos = [] } = useQuery({
        queryKey: ['todos', dateStr],
        queryFn: () => api.get(`/todos/${dateStr}`).then(res => res.data)
    });

    // 3. Fetch Learning
    const { data: sessions = [] } = useQuery({
        queryKey: ['learning', dateStr],
        queryFn: () => api.get(`/learning/${dateStr}`).then(res => res.data)
    });

    // Calculate Score
    const score = useMemo(() => {
        let totalScore = 0;

        // Habits (50%)
        if (habits.length > 0) {
            const completedHabits = habitLogs.filter(l => l.completed).length;
            const habitScore = (completedHabits / habits.length) * 50;
            totalScore += habitScore;
        } else {
            // If no habits, give full points (charitable) or 0? generous for now
            totalScore += 25;
        }

        // Todos (30%)
        if (todos.length > 0) {
            const completedTodos = todos.filter(t => t.is_completed).length;
            const todoScore = (completedTodos / todos.length) * 30;
            totalScore += todoScore;
        } else {
            // If empty todo list, neutral?
            totalScore += 0;
        }

        // Focus (20%) - Target 60 mins a day?
        const totalMinutes = sessions.reduce((acc, s) => acc + s.duration_minutes, 0);
        const focusScore = Math.min(20, (totalMinutes / 60) * 20); // Cap at 20 pts for 1 hour
        totalScore += focusScore;

        return Math.round(totalScore);
    }, [habitLogs, habits, todos, sessions]);

    const getGrade = (s) => {
        if (s >= 90) return { label: 'S', color: 'text-accent' };
        if (s >= 80) return { label: 'A', color: 'text-primary' };
        if (s >= 60) return { label: 'B', color: 'text-green-400' };
        if (s >= 40) return { label: 'C', color: 'text-yellow-400' };
        return { label: 'D', color: 'text-text-secondary' };
    };

    const grade = getGrade(score);

    return (
        <div className="bg-surface/40 p-6 rounded-3xl border border-border-subtle backdrop-blur-md flex items-center justify-between relative overflow-hidden">
            {/* Background decoration */}
            <div className={`absolute -right-4 -bottom-4 w-32 h-32 rounded-full opacity-10 filter blur-2xl ${score >= 80 ? 'bg-primary' : score >= 50 ? 'bg-green-500' : 'bg-red-500'
                }`} />

            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1 flex items-center gap-2">
                    <Activity size={12} />
                    Daily Life Score
                </p>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-text-primary tabular-nums tracking-tighter">
                        {score}
                    </span>
                    <span className="text-xs font-bold text-text-secondary uppercase">/ 100</span>
                </div>
            </div>

            <div className="text-right z-10">
                <div className={`text-5xl font-black ${grade.color} drop-shadow-lg`}>
                    {grade.label}
                </div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary mt-1">Tier</p>
            </div>
        </div>
    );
}
