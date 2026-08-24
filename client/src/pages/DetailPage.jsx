import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import VideoPlayerHUD from '../components/VideoPlayerHUD';
import SeasonNavigator from '../components/SeasonNavigator';
import MovieCard from '../components/MovieCard';
import RecommendationRail from '../components/RecommendationRail';
import ComponentErrorBoundary from '../components/ComponentErrorBoundary';
import { api, getRating, getYear } from '../services/api';
import { useWatchlist } from '../context/WatchlistContext';
import { useAudio } from '../context/AudioContext';

export default function DetailPage() {
    const { type = 'movie', id } = useParams();
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [manualServers, setManualServers] = useState(null);

    const { has, toggle } = useWatchlist();
    const { playClick } = useAudio();
    const navigate = useNavigate();

    // ── Cached media details (won't refetch if already in cache) ──
    const { data, isLoading } = useQuery({
        queryKey: ['media-detail', type, id],
        queryFn: () => api.getMediaDetails(type, id),
        enabled: !!id,
    });

    // ── Cached initial servers ──
    const { data: initialServers } = useQuery({
        queryKey: ['servers', type, id, 1, 1],
        queryFn: () => api.getServers(type, id, 1, 1),
        enabled: !!id,
    });

    // ── Smart Hybrid Recommendations Query ──
    const { data: recData, isLoading: recLoading } = useQuery({
        queryKey: ['smart-recommendations', type, id],
        queryFn: () => api.getRecommendations(type, id),
        enabled: !!id,
    });

    const servers = manualServers ?? initialServers ?? [];
    const loading = isLoading;


    const handleSelectEpisode = (s, e) => {
        setSeason(s);
        setEpisode(e);
        // Refresh server URLs for this specific episode
        api.getServers(type, id, s, e).then(res => {
            if (res) setManualServers(res);
        });
    };

    if (loading) {
        return (
            <div className="cyber-loader-wrap">
                <div className="cyber-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-core"><i className="fas fa-play"></i></div>
                </div>
                <div className="loader-text">CONNECTING TO QUANTUM STREAM (NODE.JS)...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="empty-watchlist">
                <i className="fas fa-triangle-exclamation"></i>
                <h3>Stream Metadata Unavailable</h3>
                <p>Failed to sync with backend gateway. Check connection and retry.</p>
                <button className="cyber-btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '20px' }}>
                    <i className="fas fa-rotate"></i> RETRY STREAM
                </button>
            </div>
        );
    }

    const isTV = type === 'tv';
    const title = data.title || data.name || 'Featured Title';
    const directors = data.credits?.crew?.filter(c => c.job === 'Director').map(c => c.name).join(', ') || (isTV ? data.created_by?.map(c => c.name).join(', ') : '');
    const cast = data.credits?.cast?.slice(0, 8) || [];
    const genres = data.genres || [];
    const runtime = isTV ? (`${data.number_of_seasons} Season${data.number_of_seasons > 1 ? 's' : ''} • ${data.number_of_episodes || 0} Episodes`) : (data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : 'Feature Length');
    
    // Official trailer
    const trailerVideo = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') || data.videos?.results?.find(v => v.site === 'YouTube');
    const trailerKey = trailerVideo?.key || null;

    const inWatchlist = has(data.id);

    const recItems = recData?.results || data.recommendations?.results?.slice(0, 12) || data.similar?.results?.slice(0, 12) || [];
    const recReason = recData?.reason || (title ? `Because you watched ${title}` : 'Recommended For You');

    return (
        <div className="fade-in">
            {/* Cyber Breadcrumbs */}
            <nav className="breadcrumb-nav">
                <Link to="/" onClick={playClick}><i className="fas fa-home"></i> Home</Link>
                <i className="fas fa-chevron-right" style={{ fontSize: '9px' }}></i>
                <Link to={`/genre/0/${isTV ? 'TV Shows' : 'Movies'}?mediaType=${type}`} onClick={playClick}>
                    {isTV ? 'TV Series' : 'Movies'}
                </Link>
                <i className="fas fa-chevron-right" style={{ fontSize: '9px' }}></i>
                <span style={{ color: '#fff', fontWeight: '600' }}>{title}</span>
            </nav>

            {/* Video Player HUD */}
            <ComponentErrorBoundary name="Cyber Stream Player">
                <VideoPlayerHUD
                    mediaType={type}
                    id={id}
                    season={season}
                    episode={episode}
                    title={title}
                    trailerKey={trailerKey}
                    servers={servers}
                />
            </ComponentErrorBoundary>

            {/* Main Detail Header Row */}
            <div className="glass-panel" style={{ padding: '24px 28px', borderRadius: '16px', marginBottom: '24px' }}>
                <div className="detail-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                        <h1 className="detail-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff', marginBottom: '10px' }}>
                            {title}
                        </h1>
                        <div className="detail-meta-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            <span className="glass-panel" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>star</span>
                                {getRating(data.vote_average)}
                            </span>
                            <span className="glass-panel" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                                {getYear(data.release_date || data.first_air_date)}
                            </span>
                            <span style={{ background: 'var(--cyan)', color: '#002022', fontSize: '10px', fontWeight: '900', padding: '4px 8px', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}>
                                4K ULTRA
                            </span>
                            <span className="glass-panel" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                                {runtime}
                            </span>
                            {data.universe_details && (
                                <Link
                                    to={`/genre/0/${encodeURIComponent(data.universe_details.franchise)}?endpoint=${data.universe_id}`}
                                    style={{ 
                                        backgroundColor: data.universe_details.color || 'var(--brand)',
                                        color: '#fff',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontFamily: 'var(--font-mono)'
                                    }}
                                    onClick={playClick}
                                    title="View Full Cinematic Universe Timeline"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>hub</span>
                                    {data.universe_details.badge || `UNIVERSE: ${(data.universe || data.universe_details.name || 'UNIVERSE').toUpperCase()}`}
                                    {data.universe_details.phase && ` (${data.universe_details.phase})`}
                                </Link>
                            )}
                        </div>
                    </div>

                    <button
                        className="glow-button"
                        style={{
                            background: inWatchlist ? 'rgba(255, 81, 104, 0.15)' : 'var(--brand)',
                            color: inWatchlist ? 'var(--brand-light)' : '#fff',
                            border: inWatchlist ? '1px solid var(--brand)' : 'none',
                            padding: '12px 22px',
                            borderRadius: '10px',
                            fontFamily: 'var(--font-heading)',
                            fontSize: '14px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onClick={() => {
                            playClick();
                            toggle(data);
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: inWatchlist ? "'FILL' 1" : "'FILL' 0" }}>
                            {inWatchlist ? 'check_circle' : 'bookmark_add'}
                        </span>
                        <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                    </button>
                </div>
            </div>

            {/* Bento Grid: About & User Rating Gauge */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                {/* About Bento Card */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--brand)' }}>info</span>
                        About The Title
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7' }}>
                        {data.overview || 'No synopsis available for this title.'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
                        <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Director</span>
                            <span style={{ fontWeight: '600', color: '#fff' }}>{directors || 'Visionary Creators'}</span>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Audio & Origin</span>
                            <span style={{ fontWeight: '600', color: '#fff' }}>{(data.original_language || 'en').toUpperCase()} • Dolby Atmos 5.1</span>
                        </div>
                    </div>
                    {/* Genre Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {genres.map(g => (
                            <Link
                                key={g.id}
                                to={`/genre/${g.id}/${encodeURIComponent(g.name)}`}
                                className="glass-panel"
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: '16px',
                                    fontSize: '12px',
                                    color: 'var(--text-secondary)',
                                    fontWeight: '500',
                                    transition: 'var(--transition-smooth)'
                                }}
                                onClick={playClick}
                            >
                                {g.name}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* User Rating Bento Card */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>star_half</span>
                            User Score
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
                            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '48px', fontWeight: '800', color: '#fff', lineHeight: 1 }}>
                                {getRating(data.vote_average)}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: '600' }}>/ 10</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Based on verified ratings across global streaming audiences & TMDB community reviews.
                        </p>
                    </div>
                    {/* Rating Bar */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                            <span>Audience Approval</span>
                            <span style={{ color: 'var(--brand)', fontWeight: '700' }}>{Math.round((data.vote_average || 7.5) * 10)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.round((data.vote_average || 7.5) * 10)}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand) 0%, var(--cyan) 100%)', borderRadius: '4px' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Cast Circular Avatars */}
            {cast.length > 0 && (
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--cyan)' }}>group</span>
                        Top Cast
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                        {cast.map(c => (
                            <div
                                key={c.id}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    minWidth: '96px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    playClick();
                                    navigate(`/search/${encodeURIComponent(c.name)}`);
                                }}
                            >
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', background: '#1a1c20', marginBottom: '8px', border: '2px solid rgba(255,255,255,0.1)' }}>
                                    {c.profile_path ? (
                                        <img src={`https://image.tmdb.org/t/p/w185${c.profile_path}`} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                            <span className="material-symbols-outlined">person</span>
                                        </div>
                                    )}
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff', maxWidth: '96px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {c.name}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '96px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {c.character || 'Cast'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TV Seasons & Episode Navigator */}
            {isTV && data.seasons && (
                <ComponentErrorBoundary name="Season & Episode Navigator">
                    <SeasonNavigator
                        showId={id}
                        seasons={data.seasons}
                        activeSeason={season}
                        activeEpisode={episode}
                        onSelectEpisode={handleSelectEpisode}
                    />
                </ComponentErrorBoundary>
            )}

            {/* Hybrid Recommendation Rail */}
            <ComponentErrorBoundary name="Neural Recommendations Rail">
                <RecommendationRail
                    title="Neural Match Recommendations"
                    reason={recReason}
                    items={recItems}
                    isLoading={recLoading}
                    defaultMediaType={type}
                />
            </ComponentErrorBoundary>
        </div>
    );
}
