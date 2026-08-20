import React, { createContext, useContext, useState, useEffect } from 'react';

const WatchlistContext = createContext();

export function WatchlistProvider({ children }) {
    const [watchlist, setWatchlist] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('multimovies_cyber_watchlist')) || [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('multimovies_cyber_watchlist', JSON.stringify(watchlist));
        } catch (e) {
            console.error('Failed to save watchlist:', e);
        }
    }, [watchlist]);

    const has = (id) => watchlist.some(item => String(item.id) === String(id));

    const MAX_WATCHLIST_SIZE = 500;

    const add = (item) => {
        if (watchlist.length >= MAX_WATCHLIST_SIZE) {
            console.warn('[Watchlist] Maximum size reached (' + MAX_WATCHLIST_SIZE + ')');
            return;
        }
        if (!has(item.id)) {
            const newItem = {
                id: item.id,
                title: item.title || item.name || 'Untitled',
                poster_path: item.poster_path || '',
                media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
                vote_average: item.vote_average || 0,
                release_date: item.release_date || item.first_air_date || '',
                addedAt: Date.now()
            };
            setWatchlist(prev => [newItem, ...prev]);
        }
    };

    const remove = (id) => {
        setWatchlist(prev => prev.filter(item => String(item.id) !== String(id)));
    };

    const toggle = (item) => {
        if (has(item.id)) {
            remove(item.id);
            return false;
        } else {
            add(item);
            return true;
        }
    };

    const clearAll = () => {
        setWatchlist([]);
        try {
            localStorage.removeItem('multimovies_cyber_watchlist');
        } catch (e) {
            console.error('Failed to clear watchlist storage:', e);
        }
    };

    return (
        <WatchlistContext.Provider value={{ watchlist, has, add, remove, toggle, clearAll, count: watchlist.length }}>
            {children}
        </WatchlistContext.Provider>
    );
}

export function useWatchlist() {
    return useContext(WatchlistContext);
}
