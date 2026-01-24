import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import loginHero from '../assets/login-hero.png';
import { ArrowRight, Mail, CheckCircle, ChevronLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('loading');
        try {
            await api.post('/auth/forgot-password', { email });
            setStatus('success');
        } catch (err) {
            setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Check your email</h2>
                    <p className="text-text-secondary">
                        If an account exists for <span className="text-text-primary font-medium">{email}</span>,
                        we've sent instructions to reset your password.
                    </p>
                    <div className="pt-4">
                        <Link to="/login" className="text-sm font-bold text-primary hover:underline flex items-center justify-center gap-2">
                            <ChevronLeft size={16} /> Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-background text-text-primary overflow-hidden">
            {/* Left Side - Hero Image */}
            <div className="hidden lg:flex lg:w-5/12 relative bg-surface items-center justify-center p-8 border-r border-border-subtle/50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 z-0" />
                <div className="relative z-10 w-full max-w-lg">
                    <img
                        src={loginHero}
                        alt="Productivity Abstract"
                        className="relative w-full object-cover rounded-[2rem] shadow-2xl opacity-50 grayscale"
                    />
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-8 relative">
                <div className="max-w-[400px] w-full animate-in slide-in-from-right-8 fade-in duration-700">
                    <div className="mb-10">
                        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-primary transition-colors mb-6 group">
                            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
                        </Link>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Reset Password</h2>
                        <p className="text-text-secondary">Enter your email and we'll send you a reset link.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium animate-pulse">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1 group">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary pl-1 group-focus-within:text-primary transition-colors">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-surface border-2 border-border-subtle focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all placeholder:text-text-secondary/30"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-primary text-background font-bold py-3.5 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                            {status !== 'loading' && <ArrowRight size={16} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
