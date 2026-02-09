import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { useTimer } from '../context/TimerContext';

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I\'m Atlas AI. I can help you navigate, add tasks, or log expenses. Try "Add todo Buy Milk" or "Go to Dashboard".' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const chatEndRef = useRef(null);
    const { startTimer } = useTimer();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            const { data } = await api.post('/ai/chat', { message: userMsg });

            // Handle Actions
            if (data.action === 'NAVIGATE' && data.data?.path) {
                navigate(data.data.path);
            }
            if (data.action === 'REFRESH_TASKS') {
                queryClient.invalidateQueries({ queryKey: ['todos'] });
            }
            if (data.action === 'REFRESH_EXPENSES') {
                queryClient.invalidateQueries({ queryKey: ['expenses'] });
            }
            if (data.action === 'START_TIMER' && data.data?.minutes) {
                startTimer(data.data.minutes * 60, 'down');
            }

            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I can't reach the server right now." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="bg-surface border border-border-subtle rounded-2xl shadow-2xl w-80 md:w-96 mb-4 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 flex flex-col max-h-[500px]">
                    {/* Header */}
                    <div className="bg-primary/10 p-4 border-b border-border-subtle flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-background">
                                <Sparkles size={16} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-text-primary">Atlas AI</h3>
                                <p className="text-[10px] text-text-secondary uppercase tracking-widest">Beta</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-text-primary">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 h-[300px]">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user'
                                    ? 'bg-primary text-background rounded-tr-sm'
                                    : 'bg-surface border border-border-subtle rounded-tl-sm text-text-primary'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-surface border border-border-subtle rounded-2xl rounded-tl-sm p-3 flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 border-t border-border-subtle bg-surface flex gap-2">
                        <input
                            className="flex-1 bg-background/50 border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary outline-none focus:border-primary transition-all"
                            placeholder="Ask Atlas..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button type="submit" disabled={!input.trim()} className="p-2 bg-primary text-background rounded-xl hover:opacity-90 disabled:opacity-50 transition-all">
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full bg-primary text-background shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} fill="currentColor" />}
            </button>
        </div>
    );
}
