import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#2eaadc', '#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6', '#34495e', '#16a085'];

export function SpendingTrendChart({ data }) {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-text-secondary text-xs">No data for trend</div>;

    // Group by day
    const grouped = data.reduce((acc, curr) => {
        const day = format(new Date(curr.date), 'dd');
        acc[day] = (acc[day] || 0) + curr.amount;
        return acc;
    }, {});

    const chartData = Object.keys(grouped).map(day => ({
        day,
        amount: grouped[day]
    })).sort((a, b) => parseInt(a.day) - parseInt(b.day));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
                <XAxis
                    dataKey="day"
                    tick={{ fill: '#666', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#202020', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    formatter={(value) => [`₦${value.toFixed(2)}`, 'Spent']}
                />
                <Bar dataKey="amount" fill="#2eaadc" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function CategoryPieChart({ data }) {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-text-secondary text-xs">No data for categories</div>;

    const grouped = data.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {});

    const chartData = Object.keys(grouped).map(cat => ({
        name: cat,
        value: grouped[cat]
    })).sort((a, b) => b.value - a.value);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ backgroundColor: '#202020', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => `₦${value.toFixed(2)}`}
                />
                <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: '10px' }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
