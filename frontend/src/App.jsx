import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Dashboard from './pages/Dashboard';
import ProjectsPage from './pages/ProjectsPage';
import ExpensesPage from './pages/ExpensesPage';
import Layout from './components/Layout';
import CommandPalette from './components/CommandPalette';
import TasksPage from './pages/TasksPage';
import LearningPage from './pages/LearningPage';
import FitnessPage from './pages/FitnessPage';
import JournalPage from './pages/JournalPage';
import HabitsPage from './pages/HabitsPage';
import ProfilePage from './pages/ProfilePage';
import VisionBoardPage from './pages/VisionBoardPage';
import AIAssistant from './components/AIAssistant';
import { ThemeProvider } from './context/ThemeContext';
import { TimerProvider } from './context/TimerContext';

const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-text-secondary text-sm animate-pulse tracking-widest uppercase">Atlas</div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  return (
    <Layout>
      {children}
    </Layout>
  );
};

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#191919] text-white flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Critical System Error</h1>
          <p className="text-gray-400 mb-8 max-w-md">The application encountered an unexpected error and could not render.</p>
          <div className="bg-[#202020] p-6 rounded-lg text-left max-w-2xl w-full overflow-auto border border-gray-800">
            <p className="text-red-400 font-mono text-sm mb-2">{this.state.error?.toString()}</p>
            <p className="text-gray-500 text-xs">Please check the console for more details.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-3 bg-[#2eaadc] text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <TimerProvider>
                <CommandPalette />
                <AIAssistant />
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route
                    path="/projects"
                    element={
                      <ProtectedRoute>
                        <ProjectsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/expenses"
                    element={
                      <ProtectedRoute>
                        <ExpensesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tasks"
                    element={
                      <ProtectedRoute>
                        <TasksPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/learning"
                    element={
                      <ProtectedRoute>
                        <LearningPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fitness"
                    element={
                      <ProtectedRoute>
                        <FitnessPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/journal"
                    element={
                      <ProtectedRoute>
                        <JournalPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/habits"
                    element={
                      <ProtectedRoute>
                        <HabitsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/vision"
                    element={
                      <ProtectedRoute>
                        <VisionBoardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  {/* Catch all */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </TimerProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
