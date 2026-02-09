import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    Activity,
    Calendar,
    Layers,
    LogOut,
    User as UserIcon,
    PanelLeftClose,
    PanelLeftOpen,
    Menu,
    CreditCard,
    ListTodo,
    BookOpen,
    Dumbbell,
    PenTool,
    Sun,
    Moon,
    Sparkles,
    Search
} from 'lucide-react';

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { label: 'Today', icon: Calendar, path: '/' },
        { label: 'Habits', icon: Activity, path: '/habits' },
        { label: 'Journal', icon: PenTool, path: '/journal' },
        { label: 'Tasks', icon: ListTodo, path: '/tasks' },
        { label: 'Vision', icon: Sparkles, path: '/vision' },
        { label: 'Learning', icon: BookOpen, path: '/learning' },
        { label: 'Fitness', icon: Dumbbell, path: '/fitness' },
        { label: 'Projects', icon: Layers, path: '/projects' },
        { label: 'Expenses', icon: CreditCard, path: '/expenses' },
    ];

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    if (!user) return children;

    return (
        <div className="flex min-h-screen bg-background text-text-primary transition-colors duration-300">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-20'} border-r border-border-subtle flex flex-col hidden md:flex transition-all duration-300 relative`}
            >
                {/* Toggle Button / Header */}
                <div className={`p-4 flex items-center ${isSidebarOpen ? 'justify-end' : 'justify-center'} border-b border-border-subtle/50 mb-2`}>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg hover:bg-hover text-text-secondary hover:text-text-primary transition-colors"
                    >
                        {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                    </button>
                </div>

                {/* Search Trigger */}
                <div className="px-2 mb-2">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface border border-border-subtle hover:border-primary/50 text-text-secondary hover:text-text-primary transition-all group ${!isSidebarOpen ? 'justify-center' : ''}`}
                        title={!isSidebarOpen ? "Search (Ctrl+K)" : ""}
                    >
                        <Search size={18} className="group-hover:text-primary transition-colors" />
                        {isSidebarOpen && (
                            <>
                                <span className="text-sm font-medium">Search...</span>
                                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-border-subtle bg-background/50 font-mono text-text-secondary">
                                    Ctrl K
                                </span>
                            </>
                        )}
                    </button>
                </div>

                {/* Profile Link */}
                <div className={`px-2 mb-4 ${!isSidebarOpen && 'flex justify-center'}`}>
                    <Link to="/profile" className={`flex items-center gap-3 hover:bg-hover rounded-xl transition-all overflow-hidden ${isSidebarOpen ? 'p-3' : 'p-2 justify-center'}`}>
                        <div className="min-w-[2rem] h-8 bg-gradient-to-br from-primary to-accent rounded-lg shadow-lg flex items-center justify-center text-xs font-bold text-background uppercase flex-shrink-0">
                            {(user?.full_name || 'U').charAt(0)}
                        </div>
                        {isSidebarOpen && (
                            <div className="flex flex-col truncate">
                                <span className="font-bold text-sm leading-tight text-text-primary truncate">{(user?.full_name || 'User')}</span>
                                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Free Plan</span>
                            </div>
                        )}
                    </Link>
                </div>

                <nav className="flex-1 px-2 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={!isSidebarOpen ? item.label : ''}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group ${isActive
                                    ? 'bg-hover font-medium text-primary'
                                    : 'text-text-secondary hover:bg-hover hover:text-text-primary'
                                    } ${!isSidebarOpen ? 'justify-center' : ''}`}
                            >
                                <Icon size={20} className={`transition-colors ${isActive ? 'text-primary' : 'opacity-60 group-hover:opacity-100'}`} />
                                {isSidebarOpen && <span className="truncate">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border-subtle mt-auto space-y-1">
                    <button
                        onClick={toggleTheme}
                        title="Toggle Theme"
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-hover hover:text-text-primary transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
                    >
                        {theme === 'dark' ? <Sun size={20} className="opacity-60" /> : <Moon size={20} className="opacity-60" />}
                        {isSidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>
                    <button
                        onClick={logout}
                        title="Log Out"
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-hover hover:text-text-primary transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
                    >
                        <LogOut size={20} className="opacity-60" />
                        {isSidebarOpen && <span>Log out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-0">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg border-t border-white/10 px-6 py-4 flex justify-between items-center z-50 safe-area-bottom">
                {navItems.slice(0, 5).map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
                <button
                    onClick={() => setIsSidebarOpen(true)} // Re-using this state logic might be tricky, better to just show a "More" menu or link to Profile
                    className="flex flex-col items-center gap-1 text-text-secondary"
                >
                    <Link to="/profile">
                        <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-[10px] font-bold text-background uppercase">
                            {(user?.full_name || 'U').charAt(0)}
                        </div>
                        <span className="text-[10px] font-medium">Profile</span>
                    </Link>
                </button>
            </div>
        </div>
    );
}
