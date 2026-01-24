import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, eachDayOfInterval, startOfDay, isSameDay } from 'date-fns';
import api from '../api/client';

export default function HabitHeatmap({ habits }) {
    const today = startOfDay(new Date());
    const startDate = subDays(today, 30); // Last 30 days

    const { data: logs = [] } = useQuery({
        queryKey: ['habit-logs-range', format(startDate, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd')],
        queryFn: () => api.get('/habits/logs/stats/range', {
            params: {
                start_date: format(startDate, 'yyyy-MM-dd'),
                end_date: format(today, 'yyyy-MM-dd')
            }
        }).then(res => res.data)
    });

    const days = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: today });
    }, [startDate, today]);

    // Calculate overall completion for each day
    const dayStats = useMemo(() => {
        return days.map(day => {
            const dayLogs = logs.filter(l => isSameDay(startOfDay(new Date(l.date)), day));
            const completedCount = dayLogs.filter(l => l.completed).length;
            const totalActiveHabits = habits.length;

            let intensity = 0;
            if (totalActiveHabits > 0) {
                intensity = completedCount / totalActiveHabits;
            }

            return {
                date: day,
                intensity: intensity,
                completed: completedCount,
                total: totalActiveHabits,
                allDone: totalActiveHabits > 0 && completedCount === totalActiveHabits
            };
        });
    }, [days, logs, habits]);

    const currentStreak = useMemo(() => {
        if (!logs || logs.length === 0 || !habits || habits.length === 0) return 0;

        // 1. Group logs by date
        const logsByDate = {};
        logs.forEach(log => {
            // Normalize date string just in case
            const dateKey = log.date.split('T')[0];
            if (!logsByDate[dateKey]) logsByDate[dateKey] = [];
            logsByDate[dateKey].push(log);
        });

        // 2. Determine "Perfect Days" (all habits completed)
        const perfectDays = new Set();
        Object.keys(logsByDate).forEach(date => {
            const dayLogs = logsByDate[date];
            // Check if every habit in the `habits` array has a completed log for this date
            const allHabitsCompleted = habits.every(h => {
                const log = dayLogs.find(l => l.habit_id === h.id);
                return log && log.completed;
            });
            if (allHabitsCompleted) perfectDays.add(date);
        });

        // 3. Count streak backwards from today
        let streak = 0;
        let checkDate = new Date();

        // Normalize today
        checkDate.setHours(0, 0, 0, 0);

        // Check up to 365 days back
        for (let i = 0; i < 365; i++) {
            const dateStr = format(checkDate, 'yyyy-MM-dd');

            if (perfectDays.has(dateStr)) {
                streak++;
            } else {
                // Allow "today" to be incomplete without breaking streak if yesterday was perfect
                // BUT if we are checking today (i=0) and it's not perfect, we don't count it, but we continue to yesterday.
                // Actually standard streak logic: if today is NOT done, current streak is 0?
                // Or is it the streak ENDING yesterday?
                // Let's go with: if today is NOT done, check yesterday. If yesterday is done, streak is active (but doesn't include today).
                // If yesterday is NOT done, streak is 0.
                if (i === 0) {
                    // Just skip today if not done, don't break yet
                } else {
                    break;
                }
            }
            checkDate.setDate(checkDate.getDate() - 1);
        }

        return streak;
    }, [logs, habits]);

    return (
        <div className="notion-card p-6">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Consistency (Last 30 Days)</h3>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Current Streak</p>
                    <p className="text-xl font-bold text-text-primary tabular-nums">{currentStreak} days</p>
                </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
                {dayStats.map((stat, i) => (
                    <div
                        key={i}
                        className="w-3 h-3 rounded-sm transition-all relative group"
                        style={{
                            backgroundColor: stat.intensity > 0
                                ? `rgba(46, 170, 220, ${Math.max(0.2, stat.intensity)})`
                                : 'rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface border border-border-subtle rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                            <span className="font-bold">{format(stat.date, 'MMM d')}</span>: {stat.completed}/{stat.total} habits
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Less</span>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-sm bg-primary/20" />
                        <div className="w-2 h-2 rounded-sm bg-primary/50" />
                        <div className="w-2 h-2 rounded-sm bg-primary/80" />
                        <div className="w-2 h-2 rounded-sm bg-primary" />
                    </div>
                    <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">More</span>
                </div>
            </div>
        </div>
    );
}
