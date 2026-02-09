import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import loginHero from '../assets/login-hero.png';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password, rememberMe);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background text-text-primary overflow-hidden">
            {/* Left Side - Hero Image */}
            <div className="hidden lg:flex lg:w-5/12 relative bg-surface items-center justify-center p-8 border-r border-border-subtle/50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 z-0" />

                <div className="relative z-10 w-full max-w-lg group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent opacity-30 blur-2xl group-hover:opacity-50 transition-opacity duration-1000" />
                    <img
                        src={loginHero}
                        alt="Productivity Abstract"
                        className="relative w-full object-cover rounded-[2rem] shadow-2xl animate-in fade-in zoom-in duration-1000 border border-white/10"
                    />

                    {/* Sci-Fi Caption Overlay */}
                    <div className="absolute -bottom-6 -right-6 bg-surface/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl max-w-sm animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-300">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">System Online</span>
                        </div>
                        <h1 className="text-2xl font-bold mb-2 tracking-tight">Focus on what matters.</h1>
                        <p className="text-sm text-text-secondary leading-relaxed font-mono">
                            "Atlas helps you build structure in a chaotic world."
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-8 relative">
                <div className="max-w-[400px] w-full animate-in slide-in-from-right-8 fade-in duration-700">
                    <div className="mb-10">
                        <div className="w-12 h-12 bg-primary text-background rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg shadow-primary/30 mb-6">
                            A
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h2>
                        <p className="text-text-secondary">Please enter your details to sign in.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium animate-pulse">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
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

                            <div className="space-y-1 group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary pl-1 group-focus-within:text-primary transition-colors">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full bg-surface border-2 border-border-subtle focus:border-primary rounded-xl pl-10 pr-10 py-3 text-sm outline-none transition-all placeholder:text-text-secondary/30"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary/20 accent-primary"
                                />
                                <span className="text-xs text-text-secondary">Remember me</span>
                            </label>
                            <Link to="/forgot-password" size="sm" className="text-xs font-bold text-primary hover:underline">Forgot password?</Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-background font-bold py-3.5 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                            {!isLoading && <ArrowRight size={16} />}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-text-secondary">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-primary hover:underline underline-offset-4">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
