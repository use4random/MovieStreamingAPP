import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const WatchlistContext = createContext();

const LOCAL_STORAGE_KEY = 'cinepulse_watchlist';
const LEGACY_STORAGE_KEY = 'cinepulse_pulse_watchlist';

function getLocalWatchlist() {
    if (typeof localStorage === 'undefined') return [];
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function WatchlistProvider({ children }) {
    const { user } = useAuth();
    // Initialize immediately from localStorage so hard refresh never flashes empty
    const [watchlist, setWatchlist] = useState(getLocalWatchlist);
    const [loading, setLoading] = useState(true);

    // Sync watchlist on mount and whenever authentication user state changes
    useEffect(() => {
        let isMounted = true;

        async function syncWatchlist() {
            try {
                const res = await api.getWatchlist();
                if (!isMounted) return;

                const serverList = (res && Array.isArray(res.watchlist)) ? res.watchlist : [];
                const localList = getLocalWatchlist();

                if (user) {
                    // Authenticated user: check if there are local guest items to migrate
                    const serverIds = new Set(serverList.map(item => String(item.id)));
                    const unsyncedItems = localList.filter(item => item?.id && !serverIds.has(String(item.id)));

                    if (unsyncedItems.length > 0) {
                        // Migrate local items to user's server watchlist
                        for (const item of unsyncedItems) {
                            try {
                                await api.saveWatchlist(item);
                            } catch (e) {
                                console.warn('Failed to migrate item to server:', item.id, e);
                            }
                        }
                        const mergedList = [...serverList, ...unsyncedItems];
                        if (isMounted) {
                            setWatchlist(mergedList);
                            try {
                                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedList));
                            } catch {}
                        }
                    } else {
                        // Server is authoritative for authenticated sessions
                        const finalList = serverList.length > 0 ? serverList : (localList.length > 0 && !res ? localList : serverList);
                        if (isMounted) {
                            setWatchlist(finalList);
                            try {
                                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalList));
                            } catch {}
                        }
                    }
                } else {
                    // Guest session: merge server items (via guest-id) with local storage
                    const finalList = serverList.length > 0 ? serverList : localList;
                    if (isMounted) {
                        setWatchlist(finalList);
                        try {
                            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalList));
                        } catch {}
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch watchlist from server:', err);
                if (isMounted) {
                    const fallback = getLocalWatchlist();
                    setWatchlist(fallback);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        syncWatchlist();
        return () => { isMounted = false; };
    }, [user]);

    // Keep localStorage in sync with state updates
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(watchlist));
        } catch (e) {
            console.error('Failed to sync local watchlist:', e);
        }
    }, [watchlist]);

    const has = (id) => Boolean(id) && watchlist.some(item => Boolean(item?.id) && String(item.id) === String(id));

    const add = async (item) => {
        if (!item || !item.id) return;
        if (!has(item.id)) {
            const newItem = {
                id: item.id,
                title: item.title || item.name || 'Untitled',
                poster_path: item.poster_path || '',
                backdrop_path: item.backdrop_path || '',
                media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
                vote_average: item.vote_average || 0,
                release_date: item.release_date || item.first_air_date || '',
                addedAt: new Date().toISOString()
            };
            
            // Optimistic state update
            setWatchlist(prev => [newItem, ...prev.filter(i => String(i.id) !== String(item.id))]);

            try {
                await api.saveWatchlist(newItem);
            } catch (e) {
                console.error('Failed to sync add to server:', e);
            }
        }
    };

    const remove = async (id, mediaType) => {
        if (!id) return;
        const existingItem = watchlist.find(i => String(i.id) === String(id));
        const targetType = mediaType || existingItem?.media_type || 'movie';

        // Optimistic state update
        setWatchlist(prev => prev.filter(i => String(i.id) !== String(id)));

        try {
            await api.removeWatchlist(id, targetType);
        } catch (e) {
            console.error('Failed to sync remove to server:', e);
        }
    };

    const toggle = (item) => {
        if (!item || !item.id) return false;
        if (has(item.id)) {
            remove(item.id, item.media_type || (item.first_air_date ? 'tv' : 'movie'));
            return false;
        } else {
            add(item);
            return true;
        }
    };

    const clearAll = async () => {
        const itemsToClear = [...watchlist];
        setWatchlist([]);
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch (e) {
            console.error('Failed to clear watchlist storage:', e);
        }

        // Delete from backend in background
        for (const item of itemsToClear) {
            try {
                await api.removeWatchlist(item.id, item.media_type || 'movie');
            } catch {}
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
