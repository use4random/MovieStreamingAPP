import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, getBackdrop, getPoster, getRating, getYear } from '../services/api';
import { useWatchlist } from '../context/WatchlistContext';
import { useAudio } from '../context/AudioContext';

export default function Sidebar() {
    const [popular, setPopular] = useState([]);
    const [query, setQuery] = useState('');
    const { watchlist, count } = useWatchlist();
    const navigate = useNavigate();
    const { playClick } = useAudio();

    useEffect(() => {
        api.getPopular('movie', 1).then(data => {
            if (data && data.results) setPopular(data.results.slice(0, 5));
        });
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            playClick();
            navigate(`/search/${encodeURIComponent(query.trim())}`);
            setQuery('');
        }
    };

    const watchlistPreview = watchlist.slice(0, 4);

    return (
        <aside className="sidebar">
            {/* Quick Finder Widget */}
            <div className="widget search-widget">
                <div className="widget-title"><i className="fas fa-search"></i> Quick Finder</div>
                <form className="widget-content" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search movies, series..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit"><i className="fas fa-arrow-right"></i></button>
                </form>
            </div>

            {/* Watchlist Mini-HUD Widget */}
            <div className="widget">
                <div className="widget-title" style={{ justifyContent: 'space-between' }}>
                    <span><i className="fas fa-heart" style={{ color: 'var(--brand)' }}></i> My Watchlist</span>
                    <span className="watchlist-nav-pill">{count}</span>
                </div>
                <div className="widget-content" style={{ padding: watchlistPreview.length ? 0 : '16px' }}>
                    {watchlistPreview.length > 0 ? (
                        watchlistPreview.map(item => (
                            <div
                                key={item.id}
                                className="popular-item"
                                style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)' }}
                                onClick={() => {
                                    playClick();
                                    navigate(`/detail/${item.media_type || 'movie'}/${item.id}`);
                                }}
                            >
                                <img src={getPoster(item.poster_path)} alt="" style={{ width: '36px', height: '52px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                                        {item.title}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--cyan)', marginTop: '2px' }}>
                                        <i className="fas fa-star text-gold"></i> {getRating(item.vote_average)} • {getYear(item.release_date)}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '12px 0' }}>
                            <i className="fas fa-heart-crack" style={{ fontSize: '24px', marginBottom: '8px', display: 'block', opacity: 0.5 }}></i>
                            No items saved yet.<br />Click ❤️ on any title.
                        </p>
                    )}
                    {count > 0 && (
                        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                            <Link to="/watchlist" style={{ color: 'var(--brand)', fontSize: '12px', fontWeight: '700' }} onClick={playClick}>
                                VIEW FULL LIST ({count}) →
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Trending Cinema Widget */}
            <div className="widget">
                <div className="widget-title"><i className="fas fa-fire"></i> Trending Cinema</div>
                <div className="widget-content" style={{ padding: 0 }}>
                    {popular.map(item => (
                        <div
                            key={item.id}
                            className="popular-item"
                            onClick={() => {
                                playClick();
                                navigate(`/detail/movie/${item.id}`);
                            }}
                        >
                            <div className="pop-img">
                                <img src={getBackdrop(item.backdrop_path)} alt={item.title} loading="lazy" />
                                <div className="pop-overlay">
                                    <div>
                                        <div className="pop-title">{item.title}</div>
                                        <div className="pop-year"><i className="fas fa-star text-gold"></i> {getRating(item.vote_average)} • {getYear(item.release_date)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}
