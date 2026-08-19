import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { api } from '../services/api';
import { useAudio } from '../context/AudioContext';

export default function SearchPage() {
    const { query } = useParams();
    const [results, setResults] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const { playClick } = useAudio();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setPage(1);
        setResults([]);
        setLoading(true);

        api.search(query, 1).then(data => {
            setLoading(false);
            if (data) {
                const filtered = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
                setResults(filtered);
                setTotalPages(data.total_pages || 0);
                setTotalResults(data.total_results || 0);
            }
        });
    }, [query]);

    const loadMore = async () => {
        const nextPage = page + 1;
        setLoadingMore(true);
        playClick();

        const data = await api.search(query, nextPage);
        setLoadingMore(false);

        if (data && data.results) {
            const filtered = data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv');
            setResults(prev => [...prev, ...filtered]);
            setPage(nextPage);
            setTotalPages(data.total_pages || 0);
        }
    };

    if (loading) {
        return (
            <div className="cyber-loader-wrap">
                <div className="cyber-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-core"><i className="fas fa-search"></i></div>
                </div>
                <div className="loader-text">DEEP SCANNING QUANTUM INDEX FOR "{query}"...</div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <nav className="breadcrumb-nav">
                <Link to="/" onClick={playClick}><i className="fas fa-home"></i> Home</Link>
                <i className="fas fa-chevron-right" style={{ fontSize: '9px' }}></i>
                <span style={{ color: '#fff', fontWeight: '600' }}>Search Results</span>
            </nav>

            <div className="page-header-cyber">
                <h1 className="page-title">
                    <i className="fas fa-search text-brand"></i> Search Results for: <span className="text-brand">"{query}"</span>
                </h1>
                <span className="section-count">{totalResults.toLocaleString()} results found</span>
            </div>

            {results.length > 0 ? (
                <>
                    <div className="content-grid wide">
                        {results.map(item => (
                            <MovieCard key={`${item.id}-${item.media_type}`} item={item} />
                        ))}
                    </div>

                    {page < totalPages && (
                        <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
                            {loadingMore ? (
                                <><i className="fas fa-spinner fa-spin"></i> Scanning More Feeds...</>
                            ) : (
                                <><i className="fas fa-plus-circle"></i> Load More Results ({page}/{totalPages} pages)</>
                            )}
                        </button>
                    )}
                </>
            ) : (
                <div className="empty-watchlist">
                    <i className="fas fa-search-minus"></i>
                    <h3>No Results Found</h3>
                    <p>Try a different search term or browse our collections.</p>
                    <Link to="/collections" className="cyber-btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
                        <i className="fas fa-layer-group"></i> Browse Collections
                    </Link>
                </div>
            )}
        </div>
    );
}
