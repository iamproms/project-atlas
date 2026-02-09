import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Plus, Image as ImageIcon, Trash2, Calendar, Edit3, X, Save, Eye, EyeOff, Target, ArrowUpRight } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

export default function VisionBoardPage() {
    const queryClient = useQueryClient();
    const [showAntiVision, setShowAntiVision] = useState(false);
    const [isEditingMission, setIsEditingMission] = useState(false);
    const [missionText, setMissionText] = useState("");

    // Fetch Vision Items
    const { data: items = [], isLoading } = useQuery({
        queryKey: ['vision'],
        queryFn: () => api.getVisionItems().then(res => res.data)
    });

    const createItem = useMutation({
        mutationFn: api.createVisionItem,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vision'] })
    });

    const updateItem = useMutation({
        mutationFn: ({ id, data }) => api.updateVisionItem(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vision'] });
            setIsEditingMission(false);
        }
    });

    const deleteItem = useMutation({
        mutationFn: api.deleteVisionItem,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vision'] })
    });

    // Filtering logic
    const northStar = items.find(i => i.section === 'NORTH_STAR') || { content: "Draft your life mission..." };
    const quarterly = items.filter(i => i.section === 'QUARTERLY').sort((a, b) => a.order - b.order);
    const antiVision = items.find(i => i.section === 'ANTI_VISION') || { content: "Describe the hell you are running from..." };
    const visualBoard = items.filter(i => i.section === 'VISUAL_BOARD');

    // Countdown Logic
    const targetDate = new Date('2027-01-01');
    const daysLeft = differenceInDays(targetDate, new Date());

    const handleSaveMission = () => {
        if (northStar.id) {
            updateItem.mutate({ id: northStar.id, data: { content: missionText } });
        } else {
            createItem.mutate({
                type: 'TEXT',
                content: missionText,
                section: 'NORTH_STAR',
                order: 0
            });
        }
    };

    const handleSaveAntiVision = (text) => {
        if (antiVision.id) {
            updateItem.mutate({ id: antiVision.id, data: { content: text } });
        } else {
            createItem.mutate({
                type: 'TEXT',
                content: text,
                section: 'ANTI_VISION',
                order: 0
            });
        }
    };

    return (
        <div className={`w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12 transition-colors duration-1000 ${showAntiVision ? 'bg-[#1a0505]' : ''}`}>
            {/* Header */}
            <div className="mb-12 flex items-end justify-between">
                <div>
                    <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default mb-2">
                        {showAntiVision ? '🔥' : '✨'}
                    </div>
                    <h1 className={`text-4xl font-bold tracking-tight mb-2 ${showAntiVision ? 'text-red-500' : 'text-text-primary'}`}>
                        {showAntiVision ? 'Anti-Vision' : 'North Star'}
                    </h1>
                    <p className="text-text-secondary text-lg">
                        {showAntiVision ? 'Know what you are running from.' : 'Visualize your future. Manifest your reality.'}
                    </p>
                </div>

                <button
                    onClick={() => setShowAntiVision(!showAntiVision)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${showAntiVision
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : 'bg-surface border border-white/10 text-text-secondary hover:text-white'
                        }`}
                >
                    {showAntiVision ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showAntiVision ? 'Return to Light' : 'View Anti-Vision'}
                </button>
            </div>

            {showAntiVision ? (
                <div className="animate-in fade-in duration-700">
                    <section className="bg-black/40 border border-red-900/30 p-8 rounded-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-transparent pointer-events-none" />
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-red-400 mb-6">The Hell To Avoid</h2>
                        <textarea
                            className="w-full bg-transparent text-xl font-serif text-red-100/80 outline-none resize-none min-h-[400px] leading-relaxed placeholder:text-red-900/50"
                            defaultValue={antiVision.content}
                            onBlur={(e) => handleSaveAntiVision(e.target.value)}
                            placeholder="Describe the life you dread. The version of you that gave up. Use this as fuel."
                        />
                    </section>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                    {/* Left Column: Mission & Stats */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Mission Statement */}
                        <section className="bg-surface/40 p-8 rounded-3xl border border-border-subtle backdrop-blur-md relative group hover:border-primary/20 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary">Life Mission</h2>
                                <button
                                    onClick={() => {
                                        if (isEditingMission) handleSaveMission();
                                        else {
                                            setMissionText(northStar.content);
                                            setIsEditingMission(true);
                                        }
                                    }}
                                    className="p-2 text-text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    {isEditingMission ? <Save size={16} /> : <Edit3 size={16} />}
                                </button>
                            </div>
                            {isEditingMission ? (
                                <textarea
                                    className="w-full bg-transparent text-xl font-serif italic text-text-primary outline-none resize-none border-b border-primary/20 min-h-[150px]"
                                    value={missionText}
                                    onChange={(e) => setMissionText(e.target.value)}
                                    autoFocus
                                />
                            ) : (
                                <p className="text-xl font-serif italic text-text-primary leading-relaxed whitespace-pre-line">
                                    "{northStar.content}"
                                </p>
                            )}
                        </section>

                        {/* Countdown */}
                        <section className="bg-gradient-to-br from-primary to-accent p-8 rounded-3xl text-background shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-2">The Clock Is Ticking</h2>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-6xl font-black tracking-tighter tabular-nums">{Math.abs(daysLeft)}</span>
                                    <span className="text-lg font-bold opacity-80">days {daysLeft < 0 ? 'passed' : 'left'}</span>
                                </div>
                                <p className="text-sm opacity-70 mt-2">Until {format(targetDate, 'MMMM d, yyyy')}</p>
                            </div>
                            {/* Decorative */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-10 -mt-10" />
                        </section>

                        {/* Quarterly Goals */}
                        <section className="space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary px-2">Quarterly Focus</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <QuarterlyCard quarter="Q1" label="Foundation" items={quarterly} createItem={createItem} updateItem={updateItem} deleteItem={deleteItem} />
                                <QuarterlyCard quarter="Q2" label="Expansion" items={quarterly} createItem={createItem} updateItem={updateItem} deleteItem={deleteItem} />
                                <QuarterlyCard quarter="Q3" label="Optimization" items={quarterly} createItem={createItem} updateItem={updateItem} deleteItem={deleteItem} />
                                <QuarterlyCard quarter="Q4" label="Reflection" items={quarterly} createItem={createItem} updateItem={updateItem} deleteItem={deleteItem} />
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Visual Board */}
                    <div className="lg:col-span-8">
                        <VisualBoard items={visualBoard} createItem={createItem} deleteItem={deleteItem} />
                    </div>
                </div>
            )}
        </div>
    );
}

function QuarterlyCard({ quarter, label, items, createItem, updateItem, deleteItem }) {
    // Determine order range for quarters: Q1=1-3, Q2=4-6 etc. or just strict string matching if we used section tags properly
    // For simplicity let's stick to filtering by "content" containing a tag or just using a specific key.
    // Actually, let's implement a simple goal list for each quarter card.

    // We will filter items by section 'QUARTERLY' and we might need to store the quarter in 'type' or metadata.
    // Let's repurpose 'type' field to store 'Q1', 'Q2', etc for now, or just use the card state locally if we want a strict structure.

    // BETTER APPROACH: Just show goals that user inputs.

    // Filter logic: This is a bit tricky without a dedicated field.
    // Let's optimize: We'll filter by `content` starting with "Q1:" manually or just use a dedicated JSON structure later.
    // For MVP: We render a text area for each quarter that auto-saves to a dedicated VisionItem with section="QUARTERLY" and type=quarter.

    const goalItem = items.find(i => i.type === quarter) || { content: "" };

    const handleSave = (text) => {
        if (goalItem.id) {
            updateItem.mutate({ id: goalItem.id, data: { content: text } });
        } else {
            createItem.mutate({
                type: quarter,
                content: text,
                section: 'QUARTERLY',
                order: quarter === 'Q1' ? 1 : 2 // Simple ordering
            });
        }
    };

    return (
        <div className="bg-surface border border-white/5 p-6 rounded-2xl group hover:border-primary/20 transition-all">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-white/10">{quarter}</span>
                    <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">{label}</span>
                </div>
            </div>
            <textarea
                className="w-full bg-transparent text-sm text-text-primary resize-none outline-none min-h-[80px]"
                placeholder={`Goals for ${quarter}...`}
                defaultValue={goalItem.content}
                onBlur={(e) => handleSave(e.target.value)}
            />
        </div>
    );
}

function VisualBoard({ items, createItem, deleteItem }) {
    const [isAdding, setIsAdding] = useState(false);
    const [url, setUrl] = useState('');
    const [caption, setCaption] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!url) return;
        createItem.mutate({
            type: 'IMAGE',
            content: url, // For now assuming just URL. Ideally: JSON.stringify({url, caption})
            section: 'VISUAL_BOARD',
            order: Date.now()
        });
        setUrl('');
        setCaption('');
        setIsAdding(false);
    };

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary">Inspirations</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-surface hover:bg-hover border border-border-subtle px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                    <Plus size={14} /> Add Image
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-surface p-6 rounded-2xl border border-border-subtle animate-in slide-in-from-top-4 mb-6">
                    <div className="space-y-4">
                        <input
                            className="w-full notion-input"
                            placeholder="Image URL"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold text-text-secondary">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-background rounded-lg text-xs font-bold">Add Pin</button>
                        </div>
                    </div>
                </form>
            )}

            <div className="columns-1 md:columns-2 gap-4 space-y-4">
                {items.map(item => (
                    <div key={item.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-surface mb-4">
                        <img
                            src={item.content}
                            alt="Vision"
                            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image'}
                        />
                        <button
                            onClick={() => deleteItem.mutate(item.id)}
                            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
