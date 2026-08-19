import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import MultiHubPills from '../components/MultiHubPills';
import MovieCard from '../components/MovieCard';
import { api, getPoster, getRating, getYear } from '../services/api';
import { useAudio } from '../context/AudioContext';

export default function HomePage() {
    const [trending, setTrending] = useState([]);
    const [nowPlaying, setNowPlaying] = useState([]);
    const [popularMovies, setPopularMovies] = useState([]);
    const [popularTV, setPopularTV] = useState([]);
    const [topMovies, setTopMovies] = useState([]);
    const [topTV, setTopTV] = useState([]);
    
    // Hub dynamic feed
    const [activeHub, setActiveHub] = useState('trending');
    const [hubData, setHubData] = useState({ title: 'Top Trending This Week', items: [] });
    const [hubLoading, setHubLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const { playClick } = useAudio();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        Promise.all([
            api.getTrending('all', 'week'),
            api.getNowPlaying(),
            api.getPopular('movie'),
            api.getPopular('tv'),
            api.getTopRated('movie'),
            api.getTopRated('tv')
        ]).then(([trendRes, nowRes, popMRes, popTRes, topMRes, topTRes]) => {
            if (trendRes && trendRes.results) setTrending(trendRes.results);
            if (nowRes && nowRes.results) setNowPlaying(nowRes.results.slice(0, 6));
            if (popMRes && popMRes.results) setPopularMovies(popMRes.results.slice(0, 12));
            if (popTRes && popTRes.results) setPopularTV(popTRes.results.slice(0, 12));
            if (topMRes && topMRes.results) setTopMovies(topMRes.results.slice(0, 5));
            if (topTRes && topTRes.results) setTopTV(topTRes.results.slice(0, 5));
            
            setHubData({ title: 'Top Trending This Week', items: (trendRes?.results || []).slice(0, 18) });
            setLoading(false);
        });
    }, []);

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
            <div className="cyber-loader-wrap">
                <div className="cyber-spinner">
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

            {/* Multi-Site Network Filter Pills */}
            <MultiHubPills activeHub={activeHub} onSelectHub={handleSelectHub} />

            {/* Dynamic Home Feed */}
            <section style={{ marginBottom: '38px' }}>
                <div className="section-header">
                    <h2 className="section-title">
                        {hubData.title} <span className="section-count">{hubData.items.length} Titles</span>
                    </h2>
                    <Link to={`/genre/0/${encodeURIComponent(hubData.title)}?endpoint=${activeHub}`} className="see-all-cyber" onClick={playClick}>
                        EXPLORE FULL FEED <i className="fas fa-arrow-right"></i>
                    </Link>
                </div>

                {hubLoading ? (
                    <div className="cyber-loader-wrap" style={{ padding: '40px 0' }}>
                        <div className="cyber-spinner">
                            <div className="spinner-ring"></div>
                            <div className="spinner-core"><i className="fas fa-satellite-dish"></i></div>
                        </div>
                        <div className="loader-text">SWITCHING SATELLITE FEED...</div>
                    </div>
                ) : (
                    <div className="content-grid wide">
                        {hubData.items.map(item => (
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
                        <Link to="/genre/0/Popular%20Movies?endpoint=popular&mediaType=movie" className="see-all-cyber" onClick={playClick}>
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
                        <Link to="/genre/0/Popular%20TV%20Series?endpoint=popular&mediaType=tv" className="see-all-cyber" onClick={playClick}>
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
                            <Link to="/genre/0/Top%20Rated%20Movies?endpoint=top_rated&mediaType=movie" className="see-all-cyber" onClick={playClick}>
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
                            <Link to="/genre/0/Top%20Rated%20TV%20Series?endpoint=top_rated&mediaType=tv" className="see-all-cyber" onClick={playClick}>
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
