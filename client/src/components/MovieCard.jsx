import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getPoster, getRating, getYear } from '../services/api';
import { useWatchlist } from '../context/WatchlistContext';
import { useAudio } from '../context/AudioContext';

export default function MovieCard({ item, showType = true }) {
    const navigate = useNavigate();
    const { has, toggle } = useWatchlist();
    const { playClick } = useAudio();

    if (!item) return null;

    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const title = item.title || item.name || 'Featured Title';
    const isTV = type === 'tv';
    const inWatchlist = has(item.id);
    const posterUrl = getPoster(item.poster_path);
    const itemRating = getRating(item.vote_average);
    const itemYear = getYear(item.release_date || item.first_air_date);

    const handleClick = () => {
        playClick();
        navigate(`/detail/${type}/${item.id}`);
    };

    const handleWatchlist = (e) => {
        e.stopPropagation();
        playClick();
        toggle(item);
    };

    return (
        <div className="card glass-card group" onClick={handleClick}>
            <div className="card-poster relative">
                <img src={posterUrl} alt={title} loading="lazy" />
                <div className="poster-gradient" style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}></div>
                
                {/* Desktop Top Badges */}
                <button
                    className={`card-watchlist hidden-mobile ${inWatchlist ? 'active' : ''}`}
                    onClick={handleWatchlist}
                    title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    aria-label="Toggle Watchlist"
                >
                    <i className={`fas fa-heart ${inWatchlist ? 'text-brand' : ''}`} style={{ fontSize: '14px' }}></i>
                </button>
 
                <div className="card-rating-badge hidden-mobile">
                    <i className="fas fa-star" style={{ fontSize: '11px', color: '#fbbf24', marginRight: '4px' }}></i>
                    <span>{itemRating}</span>
                </div>
 
                {/* Mobile Top Badges */}
                <div className="visible-mobile-only" style={{ position: 'absolute', top: '8px', left: '8px', right: '8px', justifyContent: 'space-between', zIndex: 10, display: 'flex', alignItems: 'center', width: 'calc(100% - 16px)' }}>
                    <span style={{ backgroundColor: 'var(--brand)', color: '#fff', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {item.universe_details ? 'UNIVERSE' : '4K'}
                    </span>
                    <span style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', color: '#fbbf24', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <i className="fas fa-star" style={{ fontSize: '9px' }}></i> {itemRating}
                    </span>
                </div>
                
                {/* Centered Play Hover Overlay */}
                <div className="card-play-overlay">
                    <button className="play-ring glow-button" aria-label="Play Stream">
                        <i className="fas fa-play" style={{ fontSize: '20px', color: '#fff' }}></i>
                    </button>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: '700', color: '#fff', letterSpacing: '0.8px', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                        STREAM NOW
                    </span>
                </div>
            </div>
 
            {/* Bottom Content Area */}
            <div className="card-info">
                <div className="hidden-mobile" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                    {item.universe_details ? (
                        <span 
                            className="card-universe-badge" 
                            style={{ backgroundColor: item.universe_details.color || 'var(--brand)' }}
                            title={`${item.universe_details.franchise}${item.universe_details.phase ? ` • ${item.universe_details.phase}` : ''}`}
                        >
                            {item.universe_details.badge || `UNIVERSE: ${(item.universe || item.universe_details.name || 'UNIVERSE').toUpperCase()}`}
                        </span>
                    ) : (
                        <span className="card-quality-badge">4K ULTRA</span>
                    )}
                    {showType && isTV && <span className="card-type-badge">TV SERIES</span>}
                </div>
 
                <h3 className="card-title" title={title}>{title}</h3>
                
                {/* Desktop Meta */}
                <div className="card-meta hidden-mobile">
                    <span>{itemYear}</span>
                    <span className="card-meta-stream">
                        <i className="fas fa-bolt" style={{ fontSize: '11px', color: 'var(--cyan)', marginRight: '4px' }}></i> FAST STREAM
                    </span>
                </div>
 
                {/* Mobile Meta */}
                <div className="card-meta visible-mobile-only" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', fontSize: '11px' }}>
                    <span>{itemYear} &bull; {isTV ? 'TV' : 'Movie'}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>FAST STREAM</span>
                </div>
            </div>
        </div>
    );
}
