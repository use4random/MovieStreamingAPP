import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const WatchlistContext = createContext();

export function WatchlistProvider({ children }) {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);

    // Sync watchlist on auth user change or mount
    useEffect(() => {
        let isMounted = true;

        async function fetchWatchlist() {
            try {
                const res = await api.getWatchlist();
                if (isMounted && res && Array.isArray(res.watchlist)) {
                    setWatchlist(res.watchlist);
                } else if (isMounted) {
                    // Fallback to local storage for guests
                    const local = JSON.parse(localStorage.getItem('cinepulse_cyber_watchlist')) || [];
                    setWatchlist(local);
                }
            } catch {
                if (isMounted) {
                    const local = JSON.parse(localStorage.getItem('cinepulse_cyber_watchlist')) || [];
                    setWatchlist(local);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchWatchlist();
        return () => { isMounted = false; };
    }, [user]);

    // Keep localStorage in sync as offline / guest backup
    useEffect(() => {
        try {
            localStorage.setItem('cinepulse_cyber_watchlist', JSON.stringify(watchlist));
        } catch (e) {
            console.error('Failed to sync local watchlist:', e);
        }
    }, [watchlist]);

    const has = (id) => Boolean(id) && watchlist.some(item => Boolean(item?.id) && String(item.id) === String(id));

    const add = async (item) => {
        if (!has(item.id)) {
            const newItem = {
                id: item.id,
                title: item.title || item.name || 'Untitled',
                poster_path: item.poster_path || '',
                media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
                vote_average: item.vote_average || 0,
                release_date: item.release_date || item.first_air_date || '',
                addedAt: new Date().toISOString()
            };
            
            // Optimistic state update
            setWatchlist(prev => [newItem, ...prev]);

            try {
                const res = await api.saveWatchlist(newItem);
                if (res && res.watchlist) {
                    setWatchlist(res.watchlist);
                }
            } catch (err) {
                console.warn('Backend watchlist save sync error:', err.message);
            }
        }
    };

    const remove = async (id, mediaType = 'movie') => {
        // Optimistic state update
        setWatchlist(prev => prev.filter(item => String(item.id) !== String(id)));

        try {
            const res = await api.removeWatchlist(id, mediaType);
            if (res && res.watchlist) {
                setWatchlist(res.watchlist);
            }
        } catch (err) {
            console.warn('Backend watchlist delete sync error:', err.message);
        }
    };

    const toggle = (item) => {
        if (has(item.id)) {
            remove(item.id, item.media_type || (item.first_air_date ? 'tv' : 'movie'));
            return false;
        } else {
            add(item);
            return true;
        }
    };

    const clearAll = () => {
        setWatchlist([]);
        try {
            localStorage.removeItem('cinepulse_cyber_watchlist');
        } catch (e) {
            console.error('Failed to clear watchlist storage:', e);
        }
    };

    return (
        <WatchlistContext.Provider value={{ watchlist, loading, has, add, remove, toggle, clearAll, count: watchlist.length }}>
            {children}
        </WatchlistContext.Provider>
    );
}

export function useWatchlist() {
    return useContext(WatchlistContext);
}
