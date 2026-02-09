import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (token) {
                try {
                    // Update client with token immediately to prevent 401 on first call
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    const { data } = await api.get('/users/me');
                    setUser(data);
                } catch (err) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    sessionStorage.removeItem('access_token');
                    sessionStorage.removeItem('refresh_token');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password, remember = true) => {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);

        const { data } = await api.post('/auth/login', params);

        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('access_token', data.access_token);
        storage.setItem('refresh_token', data.refresh_token);

        // Clear other storage to avoid conflicts
        const other = remember ? sessionStorage : localStorage;
        other.removeItem('access_token');
        other.removeItem('refresh_token');

        const userRes = await api.get('/users/me');
        setUser(userRes.data);
        return userRes.data;
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
