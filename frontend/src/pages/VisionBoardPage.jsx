import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { baseURL } from '../api/client';
import { Plus, Image as ImageIcon, Trash2, Calendar, Edit3, X, Save, Eye, EyeOff, Target, ArrowUpRight, MonitorPlay, User, Maximize2, Upload, FileText } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

const DEFAULT_MISSION = "Draft your life mission. What is the one thing you must accomplish before you die?";
const DEFAULT_ANTI_VISION = "Describe the hell you are running from. The version of you that gave up.";

// Helper to resolve image URLs
const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `${baseURL}${url}`;
};

const DEFAULT_INSPIRATIONS = [
    { id: 'def1', content: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=1000&auto=format&fit=crop', isDefault: true },
    { id: 'def2', content: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop', isDefault: true },
    { id: 'def3', content: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1000&auto=format&fit=crop', isDefault: true },
];

export default function VisionBoardPage() {
    const queryClient = useQueryClient();
    const [showAntiVision, setShowAntiVision] = useState(false);
    const [isScreensaver, setIsScreensaver] = useState(false);
    const [isQuarterlyOpen, setIsQuarterlyOpen] = useState(false);
    const [isEditingMission, setIsEditingMission] = useState(false);
    const [missionText, setMissionText] = useState("");

    // Fetch Vision Items
    const { data: items = [], isLoading } = useQuery({
        queryKey: ['vision'],
        queryFn: () => api.getVisionItems().then(res => res.data)
    });

    const createItem = useMutation({
        mutationFn: api.createVisionItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vision'] });
            setIsEditingMission(false);
        },
        onError: (err) => {
            console.error("Failed to create vision item:", err);
            alert("Failed to save. Please try again.");
        }
    });

    const updateItem = useMutation({
        mutationFn: ({ id, data }) => api.updateVisionItem(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vision'] });
            setIsEditingMission(false);
        },
        onError: (err) => {
            console.error("Failed to update vision item:", err);
            alert("Failed to save. Please try again.");
        }
    });

    const deleteItem = useMutation({
        mutationFn: api.deleteVisionItem,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vision'] })
    });

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.uploadFile(formData);
        return res.data.url;
    };

    // Filtering logic
    const northStar = items.find(i => i.section === 'NORTH_STAR') || { content: DEFAULT_MISSION };
    const quarterly = items.filter(i => i.section === 'QUARTERLY').sort((a, b) => a.order - b.order);
    const identity = items.filter(i => i.section === 'IDENTITY').sort((a, b) => a.order - b.order);
    const antiVision = items.find(i => i.section === 'ANTI_VISION') || { content: DEFAULT_ANTI_VISION };
    const visualBoardItems = items.filter(i => i.section === 'VISUAL_BOARD');

    // Combine user items with defaults if user has no items
    const visualBoard = visualBoardItems.length > 0 ? visualBoardItems : DEFAULT_INSPIRATIONS;

    // Countdown Logic
    const targetDate = new Date('2027-01-01');
    const daysLeft = differenceInDays(targetDate, new Date());

    const handleSaveMission = () => {
        const textToSave = missionText.trim();
        if (!textToSave) return;

        if (northStar.id) {
            updateItem.mutate({ id: northStar.id, data: { content: textToSave } });
        } else {
            createItem.mutate({
                type: 'TEXT',
                content: textToSave,
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

    if (isScreensaver) {
        return <Screensaver items={visualBoard} mission={northStar.content} onClose={() => setIsScreensaver(false)} />;
    }

    return (
        <div className={`w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12 transition-colors duration-1000 ${showAntiVision ? 'bg-[#1a0505]' : 'bg-background'}`}>

            {/* Quarterly Modal */}
            {isQuarterlyOpen && (
                <QuarterlyModal
                    items={quarterly}
                    onClose={() => setIsQuarterlyOpen(false)}
                    createItem={createItem}
                    updateItem={updateItem}
                    uploadImage={uploadImage}
                />
            )}

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

                <div className="flex gap-4">
                    <button
                        onClick={() => setIsScreensaver(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all bg-surface border border-white/10 text-text-secondary hover:text-white"
                    >
                        <MonitorPlay size={16} /> Focus Mode
                    </button>
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
                                    onMouseDown={(e) => e.preventDefault()} // Prevent blur from triggering before click
                                    onClick={() => {
                                        if (isEditingMission) {
                                            handleSaveMission();
                                        } else {
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

                        {/* Identity Shifting */}
                        <section className="space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary px-2 flex items-center gap-2">
                                <User size={14} /> Identity Shifting
                            </h2>
                            <div className="bg-surface border border-white/5 p-6 rounded-2xl">
                                <p className="text-xs text-text-secondary mb-4 italic">"I am the type of person who..."</p>
                                <div className="space-y-2">
                                    {identity.map(trait => (
                                        <IdentityItem key={trait.id} item={trait} updateItem={updateItem} deleteItem={deleteItem} />
                                    ))}
                                    <IdentityInput createItem={createItem} />
                                </div>
                            </div>
                        </section>

                        {/* Quarterly Focus Banner (New) */}
                        <button
                            onClick={() => setIsQuarterlyOpen(true)}
                            className="w-full bg-surface border border-white/5 hover:border-primary/50 p-6 rounded-2xl text-left group transition-all"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-3">
                                    <Calendar size={20} className="text-primary" />
                                    <h2 className="text-lg font-bold text-text-primary">Quarterly Focus</h2>
                                </div>
                                <ArrowUpRight size={20} className="text-text-secondary group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-sm text-text-secondary">View your Q1-Q4 roadmap, images, and notes.</p>
                        </button>
                    </div>

                    {/* Right Column: Visual Board */}
                    <div className="lg:col-span-8">
                        <VisualBoard items={visualBoard} createItem={createItem} deleteItem={deleteItem} uploadImage={uploadImage} />
                    </div>
                </div>
            )}
        </div>
    );
}

function QuarterlyModal({ items, onClose, createItem, updateItem, uploadImage }) {
    const quarters = [
        { id: 'Q1', label: 'Foundation' },
        { id: 'Q2', label: 'Expansion' },
        { id: 'Q3', label: 'Optimization' },
        { id: 'Q4', label: 'Reflection' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-[95vw] h-[90vh] bg-background border border-white/10 rounded-3xl overflow-hidden flex flex-col relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-text-secondary hover:text-white z-20">
                    <X size={24} />
                </button>

                <div className="p-8 border-b border-white/5">
                    <h2 className="text-3xl font-bold tracking-tight">The Year Ahead</h2>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                    <div className="grid grid-cols-4 gap-6 h-full min-w-[1200px]">
                        {quarters.map(q => (
                            <QuarterlyColumn
                                key={q.id}
                                quarter={q}
                                items={items}
                                createItem={createItem}
                                updateItem={updateItem}
                                uploadImage={uploadImage}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuarterlyColumn({ quarter, items, createItem, updateItem, uploadImage }) {
    const item = items.find(i => i.type === quarter.id) || { content: "" };

    // Parse content
    let data = { goals: "", notes: "", image: null };
    try {
        const parsed = JSON.parse(item.content);
        if (typeof parsed === 'object') data = { ...data, ...parsed };
    } catch {
        data = { ...data, goals: item.content };
    }

    const fileInputRef = useRef(null);

    const handleSave = (newData) => {
        const content = JSON.stringify({ ...data, ...newData });
        if (item.id) {
            updateItem.mutate({ id: item.id, data: { content } });
        } else {
            createItem.mutate({
                type: quarter.id,
                content,
                section: 'QUARTERLY',
                order: quarter.id === 'Q1' ? 1 : quarter.id === 'Q2' ? 2 : quarter.id === 'Q3' ? 3 : 4
            });
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const url = await uploadImage(file);
            handleSave({ image: url });
        } catch (err) {
            alert("Upload failed");
        }
    };

    return (
        <div className="h-full bg-surface border border-white/5 rounded-2xl flex flex-col overflow-hidden group hover:border-primary/20 transition-all">
            {/* Image Header */}
            <div className={`h-48 relative bg-black/50 group-hover:h-56 transition-all duration-500 shrink-0`}>
                {data.image ? (
                    <img
                        src={getImageUrl(data.image)}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/20">
                        <ImageIcon size={32} />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                <div className="absolute bottom-4 left-4">
                    <h3 className="text-4xl font-black text-white">{quarter.id}</h3>
                    <p className="text-sm font-bold text-primary uppercase tracking-widest">{quarter.label}</p>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white text-white hover:text-black rounded-full transition-all"
                >
                    <Upload size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase flex items-center gap-2">
                        <Target size={14} /> Key Objectives
                    </label>
                    <textarea
                        className="w-full bg-transparent text-sm text-text-primary resize-none outline-none min-h-[150px] leading-relaxed"
                        placeholder="- Goal 1&#10;- Goal 2&#10;- Goal 3"
                        defaultValue={data.goals}
                        onBlur={(e) => handleSave({ goals: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase flex items-center gap-2">
                        <FileText size={14} /> Notes & Strategy
                    </label>
                    <textarea
                        className="w-full bg-black/20 rounded-lg p-3 text-sm text-text-secondary resize-none outline-none min-h-[100px]"
                        placeholder="Strategy for this quarter..."
                        defaultValue={data.notes}
                        onBlur={(e) => handleSave({ notes: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
}

function IdentityInput({ createItem }) {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        createItem.mutate({
            type: 'TEXT',
            content: text,
            section: 'IDENTITY',
            order: Date.now()
        });
        setText('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                placeholder="Add a trait..."
                value={text}
                onChange={e => setText(e.target.value)}
            />
        </form>
    );
}

function IdentityItem({ item, updateItem, deleteItem }) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(item.content);

    const handleSave = () => {
        updateItem.mutate({ id: item.id, data: { content: text } });
        setIsEditing(false);
    };

    return (
        <div className="group flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
            {isEditing ? (
                <input
                    className="bg-transparent outline-none text-sm w-full font-bold text-primary"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onBlur={handleSave}
                    autoFocus
                />
            ) : (
                <span className="text-sm font-bold text-text-primary cursor-pointer" onClick={() => setIsEditing(true)}>{item.content}</span>
            )}
            <button onClick={() => deleteItem.mutate(item.id)} className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-400">
                <Trash2 size={12} />
            </button>
        </div>
    );
}

function VisualBoard({ items, createItem, deleteItem, uploadImage }) {
    const [isAdding, setIsAdding] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const url = await uploadImage(file);
            createItem.mutate({
                type: 'IMAGE',
                content: url,
                section: 'VISUAL_BOARD',
                order: Date.now()
            });
        } catch (err) {
            alert("Upload failed");
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary">Inspirations</h2>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-surface hover:bg-hover border border-border-subtle px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                    <Plus size={14} /> Add Image
                </button>
            </div>

            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                {items.map(item => (
                    <div key={item.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-surface mb-4">
                        <img
                            src={getImageUrl(item.content)}
                            alt="Vision"
                            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image'}
                        />
                        {!item.isDefault && (
                            <button
                                onClick={() => deleteItem.mutate(item.id)}
                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function Screensaver({ items, mission, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (items.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % items.length);
        }, 5000); // Change every 5 seconds
        return () => clearInterval(interval);
    }, [items]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const currentImage = items[currentIndex]?.content ? getImageUrl(items[currentIndex].content) : null;

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
            {/* Background Slideshow */}
            {currentImage && (
                <div className="absolute inset-0">
                    <img
                        src={currentImage}
                        alt="Screensaver"
                        className="w-full h-full object-cover opacity-40 animate-in fade-in duration-1000 key={currentIndex}"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>
            )}

            {/* Mission Overlay */}
            <div className="relative z-10 max-w-4xl px-8 text-center animate-in zoom-in-95 duration-1000">
                <p className="text-2xl md:text-4xl font-serif italic text-white leading-relaxed drop-shadow-2xl">
                    "{mission}"
                </p>
                <div className="mt-8 flex justify-center gap-2">
                    <div className="w-16 h-1 bg-primary rounded-full" />
                </div>
            </div>

            <button
                onClick={onClose}
                className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
            >
                <X size={24} />
            </button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-xs uppercase tracking-widest animate-pulse">
                Focus Mode Active
            </div>
        </div>
    );
}
