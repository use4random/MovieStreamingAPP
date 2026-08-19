import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { useWatchlist } from '../context/WatchlistContext';
import { useAudio } from '../context/AudioContext';

export default function WatchlistPage() {
    const { watchlist, clearAll, count } = useWatchlist();
    const [filter, setFilter] = useState('all');
    const { playClick, playWhoosh } = useAudio();

    const filteredItems = watchlist.filter(item => {
        const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        if (filter === 'movies') return type === 'movie';
        if (filter === 'series') return type === 'tv';
        if (filter === '4k') return true;
        return true;
    });

    return (
        <div className="fade-in" style={{ paddingBottom: '40px' }}>
            <div className="page-header-cyber" style={{ marginBottom: '20px' }}>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--brand)', fontVariationSettings: "'FILL' 1" }}>
                        bookmark
                    </span>
                    My Watchlist
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className="section-count">{count} saved titles</span>
                    {count > 0 && (
                        <button
                            className="cyber-btn-sm danger"
                            onClick={(e) => {
                                e.preventDefault();
                                playWhoosh();
                                clearAll();
                            }}
                            title="Clear all saved titles from Watchlist"
                            style={{ cursor: 'pointer', zIndex: 10 }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>delete</span> Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
                <button
                    className={`hub-pill ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => { playClick(); setFilter('all'); }}
                >
                    All ({count})
                </button>
                <button
                    className={`hub-pill ${filter === 'movies' ? 'active' : ''}`}
                    onClick={() => { playClick(); setFilter('movies'); }}
                >
                    Movies ({watchlist.filter(i => (i.media_type || (i.first_air_date ? 'tv' : 'movie')) === 'movie').length})
                </button>
                <button
                    className={`hub-pill ${filter === 'series' ? 'active' : ''}`}
                    onClick={() => { playClick(); setFilter('series'); }}
                >
                    Series ({watchlist.filter(i => (i.media_type || (i.first_air_date ? 'tv' : 'movie')) === 'tv').length})
                </button>
                <button
                    className={`hub-pill ${filter === '4k' ? 'active' : ''}`}
                    onClick={() => { playClick(); setFilter('4k'); }}
                >
                    4K Ultra
                </button>
            </div>

            {filteredItems.length > 0 ? (
                <div className="content-grid wide">
                    {filteredItems.map(item => (
                        <MovieCard key={item.id} item={item} />
                    ))}
                </div>
            ) : (
                <div className="empty-watchlist glass-panel" style={{ padding: '60px 20px', borderRadius: '16px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        bookmark_border
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
                        {filter === 'all' ? 'Your Watchlist is Empty' : `No ${filter} found in your watchlist`}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px' }}>
                        Save movies, TV shows, and cinematic universe sagas to quickly resume streaming anytime.
                    </p>
                    <Link
                        to="/"
                        className="glow-button"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'var(--brand)',
                            color: '#fff',
                            padding: '12px 28px',
                            borderRadius: '8px',
                            fontFamily: 'var(--font-heading)',
                            fontWeight: '700'
                        }}
                        onClick={playClick}
                    >
                        <span className="material-symbols-outlined">explore</span> Explore Movies & Series
                    </Link>
                </div>
            )}
        </div>
    );
}

