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
        if (res && res.user) {
            setUser(res.user);
            setAuthModalOpen(false);
            return res.user;
        }
        throw new Error(res?.error || 'Login failed');
    };

    const register = async (username, email, password) => {
        const res = await api.register(username, email, password);
        if (res && res.user) {
            setUser(res.user);
            setAuthModalOpen(false);
            return res.user;
        }
        throw new Error(res?.error || 'Registration failed');
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
            isAuthenticated: !!user,
            loading,
            login,
            register,
            logout,
            authModalOpen,
            authMode,
            setAuthMode,
            openAuthModal,
            closeAuthModal
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
