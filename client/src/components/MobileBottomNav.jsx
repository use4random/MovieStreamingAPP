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
                <i className="fas fa-home" style={{ fontSize: '18px' }}></i>
                <span>Home</span>
            </Link>

            {/* Discover */}
            <Link
                to="/collections"
                className={`mobile-bottom-nav-item ${location.pathname === '/collections' ? 'active' : ''}`}
                onClick={playClick}
            >
                <i className="fas fa-compass" style={{ fontSize: '18px' }}></i>
                <span>Discover</span>
            </Link>

            {/* Watchlist */}
            <Link
                to="/watchlist"
                className={`mobile-bottom-nav-item ${location.pathname === '/watchlist' ? 'active' : ''}`}
                onClick={playClick}
            >
                <div style={{ position: 'relative' }}>
                    <i className="fas fa-bookmark" style={{ fontSize: '18px' }}></i>
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
                <i className="fas fa-search" style={{ fontSize: '18px' }}></i>
                <span>Search</span>
            </button>
        </nav>
    );
}
