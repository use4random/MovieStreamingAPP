import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

    useEffect(() => {
        let mounted = true;
        async function checkAuth() {
            try {
                const res = await api.getCurrentUser();
                if (mounted && res && res.user) {
                    setUser(res.user);
                } else if (mounted) {
                    setUser(null);
                }
            } catch {
                if (mounted) {
                    setUser(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }

        checkAuth();
        return () => { mounted = false; };
    }, []);

    const login = async (identifier, password) => {
        const res = await api.login(identifier, password);
        if (res && (res.user || res.token || res.success)) {
            const userData = res.user || { username: identifier, email: identifier, role: 'user' };
            setUser(userData);
            setAuthModalOpen(false);
            return userData;
        }
        throw new Error(res?.error || 'Login failed. Please check your credentials.');
    };

    const register = async (username, email, password) => {
        const res = await api.register(username, email, password);
        if (res && (res.user || res.token || res.success)) {
            const userData = res.user || { username, email, role: 'user' };
            setUser(userData);
            setAuthModalOpen(false);
            return userData;
        }
        throw new Error(res?.error || 'Registration failed. Please try again.');
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch (e) {
            console.warn('Logout server request failed:', e.message);
        }
        setUser(null);
    };

    const openAuthModal = (mode = 'login') => {
        setAuthMode(mode);
        setAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setAuthModalOpen(false);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated: !!user,
            authModalOpen,
            authMode,
            setAuthMode,
            openAuthModal,
            closeAuthModal,
            login,
            register,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
