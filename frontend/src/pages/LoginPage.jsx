import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api, { baseURL } from '../api/client';
import loginHero from '../assets/login-hero.png';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [testStatus, setTestStatus] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const testConnection = async () => {
        setTestStatus('testing');
        try {
            const { data } = await api.get('/health');
            setTestStatus(`SUCCESS: ${data.message}`);
        } catch (err) {
            setTestStatus(`FAILED: ${err.message}`);
            console.error('[Atlas Debug] Connection test failed:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            console.error('[Atlas Auth] Login failed:', err);
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

                        {/* Connection Debug Info */}
                        <div className="mt-4 p-3 bg-surface/30 border border-border-subtle/50 rounded-lg text-[10px] uppercase tracking-tighter font-mono">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-text-secondary/50">API Base:</span>
                                <span className="text-primary truncate ml-2">{baseURL}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-secondary/50">Status:</span>
                                <span className={testStatus?.includes('SUCCESS') ? 'text-green-500' : 'text-accent'}>
                                    {testStatus || 'Not Tested'}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={testConnection}
                                className="w-full mt-2 py-1 px-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded transition-colors text-[9px] font-bold"
                            >
                                Test Connection
                            </button>
                        </div>
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
                                        type="password"
                                        required
                                        className="w-full bg-surface border-2 border-border-subtle focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all placeholder:text-text-secondary/30"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary/20 accent-primary" />
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
