import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWatchlist } from '../context/WatchlistContext';
import { useAudio } from '../context/AudioContext';

export default function MobileBottomNav({ onOpenSearch }) {
    const location = useLocation();
    const { count } = useWatchlist();
    const { playClick } = useAudio();

    return (
        <nav className="mobile-bottom-nav md:hidden">
            {/* Home */}
            <Link
                to="/"
                className={`mobile-bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}
                onClick={playClick}
            >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: location.pathname === '/' ? "'FILL' 1" : "'FILL' 0" }}>
                    home
                </span>
                <span>Home</span>
            </Link>

            {/* Discover */}
            <Link
                to="/collections"
                className={`mobile-bottom-nav-item ${location.pathname === '/collections' ? 'active' : ''}`}
                onClick={playClick}
            >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: location.pathname === '/collections' ? "'FILL' 1" : "'FILL' 0" }}>
                    explore
                </span>
                <span>Discover</span>
            </Link>

            {/* Watchlist */}
            <Link
                to="/watchlist"
                className={`mobile-bottom-nav-item ${location.pathname === '/watchlist' ? 'active' : ''}`}
                onClick={playClick}
            >
                <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: location.pathname === '/watchlist' ? "'FILL' 1" : "'FILL' 0" }}>
                        bookmark
                    </span>
                    {count > 0 && (
                        <span className="mobile-nav-count-badge">{count}</span>
                    )}
                </div>
                <span>Watchlist</span>
            </Link>

            {/* Search */}
            <button
                className="mobile-bottom-nav-item"
                onClick={() => {
                    playClick();
                    onOpenSearch();
                }}
            >
                <span className="material-symbols-outlined">
                    search
                </span>
                <span>Search</span>
            </button>
        </nav>
    );
}
