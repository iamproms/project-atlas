import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Image as ImageIcon, Trash2, Calendar, Edit3, X, Save } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

// Since we don't have a real backend for the vision board yet, we'll use local state for the prototype
// Ideally this would be persisted to the backend.

const MOCK_INITIAL_IMAGES = [
    { id: 1, src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', caption: 'Dream Office' },
    { id: 2, src: 'https://images.unsplash.com/photo-1526304640152-d4619684e484?auto=format&fit=crop&w=800&q=80', caption: 'Financial Freedom' },
    { id: 3, src: 'https://images.unsplash.com/photo-1547483954-50b31d683526?auto=format&fit=crop&w=800&q=80', caption: 'Travel to Japan' },
    { id: 4, src: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80', caption: 'Fitness Goals' },
    { id: 5, src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80', caption: 'Community' },
];

export default function VisionBoardPage() {
    const [mission, setMission] = useState("To build a life of freedom, impact, and continuous learning. To empower myself and others to reach their full potential.");
    const [isEditingMission, setIsEditingMission] = useState(false);
    const [images, setImages] = useState(MOCK_INITIAL_IMAGES);
    const [newImage, setNewImage] = useState('');
    const [newCaption, setNewCaption] = useState('');
    const [isAddingImage, setIsAddingImage] = useState(false);

    // Countdown Logic (simplified for now)
    const targetDate = new Date('2026-01-01'); // End of Year Goal
    const daysLeft = differenceInDays(targetDate, new Date());

    const handleAddImage = (e) => {
        e.preventDefault();
        if (!newImage) return;
        setImages([...images, { id: Date.now(), src: newImage, caption: newCaption }]);
        setNewImage('');
        setNewCaption('');
        setIsAddingImage(false);
    };

    return (
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 md:py-12">
            <div className="mb-12">
                <div className="w-12 h-12 flex items-center justify-center text-4xl grayscale hover:grayscale-0 transition-all cursor-default mb-2">
                    🌟
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Vision Board</h1>
                <p className="text-text-secondary text-lg">Visualize your future. Manifest your reality.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Mission & Countdown */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Mission Statement */}
                    <section className="bg-surface/40 p-8 rounded-3xl border border-border-subtle backdrop-blur-md relative group">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary">North Star</h2>
                            <button
                                onClick={() => setIsEditingMission(!isEditingMission)}
                                className="p-2 text-text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                            >
                                {isEditingMission ? <Save size={16} /> : <Edit3 size={16} />}
                            </button>
                        </div>
                        {isEditingMission ? (
                            <textarea
                                className="w-full bg-transparent text-xl font-serif italic text-text-primary outline-none resize-none border-b border-primary/20"
                                value={mission}
                                onChange={(e) => setMission(e.target.value)}
                                rows={4}
                                autoFocus
                            />
                        ) : (
                            <p className="text-xl font-serif italic text-text-primary leading-relaxed">
                                "{mission}"
                            </p>
                        )}
                    </section>

                    {/* Countdown */}
                    <section className="bg-gradient-to-br from-primary to-accent p-8 rounded-3xl text-background shadow-xl">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-2">Year End Goal</h2>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black tracking-tighter tabular-nums">{Math.abs(daysLeft)}</span>
                            <span className="text-lg font-bold opacity-80">days {daysLeft < 0 ? 'passed' : 'left'}</span>
                        </div>
                        <p className="text-sm opacity-70 mt-2">Until {format(targetDate, 'MMMM d, yyyy')}</p>
                    </section>
                </div>

                {/* Right: Masonry Grid */}
                <div className="lg:col-span-8">
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary">Inspirations</h2>
                            <button
                                onClick={() => setIsAddingImage(true)}
                                className="flex items-center gap-2 bg-surface hover:bg-hover border border-border-subtle px-4 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                                <Plus size={14} /> Add Image
                            </button>
                        </div>

                        {/* Add Image Form */}
                        {isAddingImage && (
                            <form onSubmit={handleAddImage} className="bg-surface p-6 rounded-2xl border border-border-subtle animate-in slide-in-from-top-4 mb-6">
                                <h3 className="text-sm font-bold mb-4">Add to Vision Board</h3>
                                <div className="space-y-4">
                                    <input
                                        className="w-full notion-input"
                                        placeholder="Image URL (Unsplash, etc.)"
                                        value={newImage}
                                        onChange={(e) => setNewImage(e.target.value)}
                                        autoFocus
                                    />
                                    <input
                                        className="w-full notion-input"
                                        placeholder="Caption (optional)"
                                        value={newCaption}
                                        onChange={(e) => setNewCaption(e.target.value)}
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button type="button" onClick={() => setIsAddingImage(false)} className="px-4 py-2 text-xs font-bold text-text-secondary">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-primary text-background rounded-lg text-xs font-bold">Add Pin</button>
                                    </div>
                                </div>
                            </form>
                        )}

                        <div className="columns-1 md:columns-2 gap-4 space-y-4">
                            {images.map(img => (
                                <div key={img.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-surface">
                                    <img
                                        src={img.src}
                                        alt={img.caption}
                                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                        <p className="text-white font-bold">{img.caption}</p>
                                    </div>
                                    <button
                                        onClick={() => setImages(images.filter(i => i.id !== img.id))}
                                        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
