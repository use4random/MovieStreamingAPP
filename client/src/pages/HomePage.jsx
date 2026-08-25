import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import HeroCarousel from '../components/HeroCarousel';
import MultiHubPills from '../components/MultiHubPills';
import MovieCard from '../components/MovieCard';
import { api, getPoster, getRating, getYear } from '../services/api';
import { useAudio } from '../context/AudioContext';
import { useCinePulseStore } from '../store/useCinePulseStore';

const QUICK_GENRES = [
    { id: 28, name: 'Action' },
    { id: 35, name: 'Comedy' },
    { id: 878, name: 'Sci-Fi' },
    { id: 27, name: 'Horror' },
    { id: 10749, name: 'Romance' },
    { id: 18, name: 'Drama' }
];

export default function HomePage() {
    const { activeHub, setActiveHub } = useCinePulseStore();
    const [hubData, setHubData] = useState({ title: 'Top Trending This Week', items: [] });
    const [hubLoading, setHubLoading] = useState(false);
    const { playClick } = useAudio();

    // ── React Query cached fetches (5-min stale time from QueryClient defaults) ──
    const { data: trendRes, isLoading: loadingTrend } = useQuery({
        queryKey: ['trending', 'all', 'week'],
        queryFn: () => api.getTrending('all', 'week'),
    });
    const { data: nowRes, isLoading: loadingNow } = useQuery({
        queryKey: ['now-playing'],
        queryFn: () => api.getNowPlaying(),
    });
    const { data: popMRes } = useQuery({
        queryKey: ['popular', 'movie'],
        queryFn: () => api.getPopular('movie'),
    });
    const { data: popTRes } = useQuery({
        queryKey: ['popular', 'tv'],
        queryFn: () => api.getPopular('tv'),
    });
    const { data: topMRes } = useQuery({
        queryKey: ['top-rated', 'movie'],
        queryFn: () => api.getTopRated('movie'),
    });
    const { data: topTRes } = useQuery({
        queryKey: ['top-rated', 'tv'],
        queryFn: () => api.getTopRated('tv'),
    });

    const trending = trendRes?.results || [];
    const nowPlaying = nowRes?.results?.slice(0, 6) || [];
    const popularMovies = popMRes?.results?.slice(0, 12) || [];
    const popularTV = popTRes?.results?.slice(0, 12) || [];
    const topMovies = topMRes?.results?.slice(0, 5) || [];
    const topTV = topTRes?.results?.slice(0, 5) || [];

    // Set hub data from trending once loaded
    const currentHubItems = activeHub === 'trending' && trending.length > 0
        ? { title: 'Top Trending This Week', items: trending.slice(0, 18) }
        : hubData;

    const loading = loadingTrend || loadingNow;


    const handleSelectHub = async (hubId) => {
        setActiveHub(hubId);
        setHubLoading(true);

        let data;
        let titleName = 'Trending Titles';

        if (hubId === 'trending') { data = await api.getTrending('all', 'week'); titleName = 'Top Trending This Week'; }
        else if (hubId === 'trending_day') { data = await api.getTrending('all', 'day'); titleName = 'Trending Today (24h Real-Time)'; }
        else if (hubId === 'netflix') { data = await api.getPlatformFeed('netflix'); titleName = 'Netflix Originals & Global Hits'; }
        else if (hubId === 'prime') { data = await api.getPlatformFeed('prime'); titleName = 'Amazon Prime Video Exclusives'; }
        else if (hubId === 'disney') { data = await api.getPlatformFeed('disney'); titleName = 'Disney+ & Marvel & Star Wars'; }
        else if (hubId === 'hbo') { data = await api.getPlatformFeed('hbo'); titleName = 'HBO Max & Warner Bros Blockbusters'; }
        else if (hubId === 'anime_hub') { data = await api.getPlatformFeed('anime_hub'); titleName = 'Anime Mega-Vault (Top Hits)'; }
        else if (hubId === 'marvel') { data = await api.getPlatformFeed('marvel'); titleName = 'Marvel Cinematic Universe (MCU)'; }
        else if (hubId === 'kdrama') { data = await api.getPlatformFeed('kdrama'); titleName = 'Korean Wave (K-Drama & Cinema)'; }
        else if (hubId === 'bollywood') { data = await api.getPlatformFeed('bollywood'); titleName = 'Bollywood & Pan-India Cinema Spectacles'; }

        setHubLoading(false);
        setHubData({
            title: titleName,
            items: (data?.results || []).slice(0, 18)
        });
    };

    if (loading) {
        return (
            <div className="pulse-loader-wrap">
                <div className="pulse-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-core"><i className="fas fa-film"></i></div>
                </div>
                <div className="loader-text">STREAMING QUANTUM SATELLITE FEEDS (REACT)...</div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Hero Carousel */}
            <HeroCarousel items={trending} />

            {/* Genres Quick Links (Mobile Only) */}
            <div className="visible-mobile-only" style={{ padding: '0 8px 16px 8px', marginTop: '-12px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    width: '100%'
                }}>
                    {QUICK_GENRES.map(genre => (
                        <Link
                            key={genre.id}
                            to={`/genre/${genre.id}/${encodeURIComponent(genre.name)}?mediaType=movie`}
                            onClick={playClick}
                            className="glass-panel"
                            style={{
                                padding: '12px 8px',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                textAlign: 'center',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.25s ease'
                            }}
                        >
                            {genre.name}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Multi-Site Network Filter Pills */}
            <MultiHubPills activeHub={activeHub} onSelectHub={handleSelectHub} />

            {/* Dynamic Home Feed */}
            <section style={{ marginBottom: '38px' }}>
                <div className="section-header">
                    <h2 className="section-title">
                        {currentHubItems.title} <span className="section-count">{currentHubItems.items.length} Titles</span>
                    </h2>
                    <Link to={`/genre/0/${encodeURIComponent(currentHubItems.title)}?endpoint=${activeHub}`} className="see-all-pulse" onClick={playClick}>
                        EXPLORE FULL FEED <i className="fas fa-arrow-right"></i>
                    </Link>
                </div>

                {hubLoading ? (
                    <div className="pulse-loader-wrap" style={{ padding: '40px 0' }}>
                        <div className="pulse-spinner">
                            <div className="spinner-ring"></div>
                            <div className="spinner-core"><i className="fas fa-satellite-dish"></i></div>
                        </div>
                        <div className="loader-text">SWITCHING SATELLITE FEED...</div>
                    </div>
                ) : (
                    <div className="content-grid wide">
                        {currentHubItems.items.map(item => (
                            <MovieCard key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </section>

            {/* In Theaters */}
            {nowPlaying.length > 0 && (
                <section style={{ marginBottom: '38px' }}>
                    <div className="section-header">
                        <h2 className="section-title">In Theaters & Premiere 4K</h2>
                    </div>
                    <div className="content-grid">
                        {nowPlaying.map(item => (
                            <MovieCard key={item.id} item={{ ...item, media_type: 'movie' }} />
                        ))}
                    </div>
                </section>
            )}

            {/* Popular Movies */}
            {popularMovies.length > 0 && (
                <section style={{ marginBottom: '38px' }}>
                    <div className="section-header">
                        <h2 className="section-title">Global Blockbuster Movies</h2>
                        <Link to="/genre/0/Popular%20Movies?endpoint=popular&mediaType=movie" className="see-all-pulse" onClick={playClick}>
                            EXPLORE ALL <i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>
                    <div className="content-grid">
                        {popularMovies.map(item => (
                            <MovieCard key={item.id} item={{ ...item, media_type: 'movie' }} />
                        ))}
                    </div>
                </section>
            )}

            {/* Binge-Worthy TV Series */}
            {popularTV.length > 0 && (
                <section style={{ marginBottom: '38px' }}>
                    <div className="section-header">
                        <h2 className="section-title">Binge-Worthy TV Series</h2>
                        <Link to="/genre/0/Popular%20TV%20Series?endpoint=popular&mediaType=tv" className="see-all-pulse" onClick={playClick}>
                            EXPLORE ALL <i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>
                    <div className="content-grid">
                        {popularTV.map(item => (
                            <MovieCard key={item.id} item={{ ...item, media_type: 'tv' }} />
                        ))}
                    </div>
                </section>
            )}

            {/* Top Lists */}
            <section className="top-list">
                <div className="top-list-grid">
                    <div className="top-list-column">
                        <div className="section-header">
                            <h2 className="section-title">TOP RATED MOVIES</h2>
                            <Link to="/genre/0/Top%20Rated%20Movies?endpoint=top_rated&mediaType=movie" className="see-all-pulse" onClick={playClick}>
                                TOP 50
                            </Link>
                        </div>
                        {topMovies.map((item, idx) => (
                            <Link key={item.id} to={`/detail/movie/${item.id}`} className="top-list-item" onClick={playClick}>
                                <span className="top-rank-num">0{idx + 1}</span>
                                <img src={getPoster(item.poster_path)} className="top-thumb" alt={item.title} />
                                <div className="top-info">
                                    <div className="top-item-title">{item.title}</div>
                                    <div className="top-item-meta">
                                        <span style={{ color: 'var(--gold)', fontWeight: '700' }}><i className="fas fa-star"></i> {getRating(item.vote_average)}</span>
                                        <span>•</span>
                                        <span>{getYear(item.release_date)}</span>
                                    </div>
                                </div>
                                <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: 'var(--text-muted)' }}></i>
                            </Link>
                        ))}
                    </div>

                    <div className="top-list-column">
                        <div className="section-header">
                            <h2 className="section-title">TOP TV SERIES</h2>
                            <Link to="/genre/0/Top%20Rated%20TV%20Series?endpoint=top_rated&mediaType=tv" className="see-all-pulse" onClick={playClick}>
                                TOP 50
                            </Link>
                        </div>
                        {topTV.map((item, idx) => (
                            <Link key={item.id} to={`/detail/tv/${item.id}`} className="top-list-item" onClick={playClick}>
                                <span className="top-rank-num">0{idx + 1}</span>
                                <img src={getPoster(item.poster_path)} className="top-thumb" alt={item.name} />
                                <div className="top-info">
                                    <div className="top-item-title">{item.name}</div>
                                    <div className="top-item-meta">
                                        <span style={{ color: 'var(--gold)', fontWeight: '700' }}><i className="fas fa-star"></i> {getRating(item.vote_average)}</span>
                                        <span>•</span>
                                        <span>{getYear(item.first_air_date)}</span>
                                    </div>
                                </div>
                                <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: 'var(--text-muted)' }}></i>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
