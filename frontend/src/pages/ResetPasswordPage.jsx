import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import loginHero from '../assets/login-hero.png';
import { ArrowRight, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const tokenFromUrl = searchParams.get('token') || '';

    const [formData, setFormData] = useState({
        token: tokenFromUrl,
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setStatus('loading');
        try {
            await api.post('/auth/reset-password', {
                token: formData.token,
                new_password: formData.password
            });
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid or expired token.');
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
                    <h2 className="text-3xl font-bold tracking-tight">Password Updated</h2>
                    <p className="text-text-secondary">
                        Your password has been reset successfully. Redirecting you to login...
                    </p>
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
                        <h2 className="text-3xl font-bold tracking-tight mb-2">New Password</h2>
                        <p className="text-text-secondary">Enter your reset token and new password.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm font-medium animate-pulse">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1 group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary pl-1 group-focus-within:text-primary transition-colors">Reset Token</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-surface border-2 border-border-subtle focus:border-primary rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-text-secondary/30 font-mono"
                                    value={formData.token}
                                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                    placeholder="Paste token from email"
                                />
                            </div>

                            <div className="space-y-1 group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary pl-1 group-focus-within:text-primary transition-colors">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full bg-surface border-2 border-border-subtle focus:border-primary rounded-xl pl-10 pr-10 py-3 text-sm outline-none transition-all placeholder:text-text-secondary/30"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1 group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary pl-1 group-focus-within:text-primary transition-colors">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full bg-surface border-2 border-border-subtle focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all placeholder:text-text-secondary/30"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-primary text-background font-bold py-3.5 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {status === 'loading' ? 'Updating...' : 'Update Password'}
                            {status !== 'loading' && <ArrowRight size={16} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
