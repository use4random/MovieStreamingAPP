import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { api } from '../services/api';
import { useAudio } from '../context/AudioContext';

export default function GenrePage() {
    const { genreId, name } = useParams();
    const [searchParams] = useSearchParams();
    const endpoint = searchParams.get('endpoint') || null;
    const mediaType = searchParams.get('mediaType') || 'movie';

    const [results, setResults] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const { playClick } = useAudio();

    const fetchPage = async (p) => {
        const gId = parseInt(genreId);

        // Endpoint-based feeds (trending, top_rated, popular, platform feeds, etc.)
        if (endpoint) {
            switch (endpoint) {
                case 'trending':
                    return await api.getTrending('all', 'week', p);
                case 'trending_day':
                    return await api.getTrending('all', 'day', p);
                case 'top_rated':
                    return await api.getTopRated(mediaType, p);
                case 'popular':
                    return await api.getPopular(mediaType, p);
                case 'on_the_air':
                    return await api.getOnTheAir(p);
                // Platform & Universe feeds
                case 'netflix':
                case 'prime':
                case 'disney':
                case 'hbo':
                case 'appletv':
                case 'paramount':
                case 'anime_hub':
                case 'kdrama':
                case 'bollywood':
                case 'hollywood':
                case 'marvel':
                case 'dc':
                case 'starwars':
                case 'wizarding_world':
                case 'monsterverse':
                case 'middle_earth':
                case 'spider_verse':
                case 'xmen':
                case 'fast_and_furious':
                case 'john_wick':
                    return await api.getPlatformFeed(endpoint, p);
                default:
                    return await api.getTrending('all', 'week', p);
            }
        }

        // Genre-based discover
        if (gId > 0) {
            return await api.getDiscover({ genreId: gId, mediaType, page: p });
        }

        // Fallback
        return await api.getPopular(mediaType, p);
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setPage(1);
        setResults([]);
        setLoading(true);

        fetchPage(1).then(data => {
            setLoading(false);
            if (data) {
                setResults(data.results || []);
                setTotalPages(data.total_pages || 0);
                setTotalResults(data.total_results || 0);
            }
        });
    }, [genreId, name, endpoint, mediaType]);

    const loadMore = async () => {
        const nextPage = page + 1;
        setLoadingMore(true);
        playClick();

        const data = await fetchPage(nextPage);
        setLoadingMore(false);

        if (data && data.results) {
            setResults(prev => [...prev, ...data.results]);
            setPage(nextPage);
            setTotalPages(data.total_pages || 0);
        }
    };

    if (loading) {
        return (
            <div className="pulse-loader-wrap">
                <div className="pulse-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-core"><i className="fas fa-layer-group"></i></div>
                </div>
                <div className="loader-text">LOADING {decodeURIComponent(name || '').toUpperCase()} FEED...</div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <nav className="breadcrumb-nav">
                <Link to="/" onClick={playClick}><i className="fas fa-home"></i> Home</Link>
                <i className="fas fa-chevron-right" style={{ fontSize: '9px' }}></i>
                <span style={{ color: '#fff', fontWeight: '600' }}>{decodeURIComponent(name || 'Browse')}</span>
            </nav>

            <div className="page-header-pulse">
                <h1 className="page-title">
                    <i className="fas fa-fire text-brand"></i> {decodeURIComponent(name || 'Browse')}
                </h1>
                <span className="section-count">{totalResults.toLocaleString()} titles available</span>
            </div>

            {results.length > 0 ? (
                <>
                    <div className="content-grid wide">
                        {results.map((item, idx) => {
                            const type = item.media_type || mediaType;
                            return <MovieCard key={`${item.id}-${idx}`} item={{ ...item, media_type: type }} />;
                        })}
                    </div>

                    {page < totalPages && (
                        <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
                            {loadingMore ? (
                                <><i className="fas fa-spinner fa-spin"></i> Loading More...</>
                            ) : (
                                <><i className="fas fa-plus-circle"></i> Load More ({page}/{Math.min(totalPages, 500)} pages)</>
                            )}
                        </button>
                    )}
                </>
            ) : (
                <div className="empty-watchlist">
                    <i className="fas fa-folder-open"></i>
                    <h3>No Titles Found</h3>
                    <p>This feed has no content currently. Try browsing a different category.</p>
                </div>
            )}
        </div>
    );
}
