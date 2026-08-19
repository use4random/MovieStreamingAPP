import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getPoster, getRating, getYear } from '../services/api';
import { useAudio } from '../context/AudioContext';

export default function SearchModal({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { playClick, playWhoosh } = useAudio();

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
            setTimeout(() => inputRef.current?.focus(), 50);
            playWhoosh();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim() || query.trim().length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            const data = await api.search(query.trim(), 1);
            setLoading(false);
            if (data && data.results) {
                setResults(data.results.slice(0, 6));
            }
        }, 280);

        return () => clearTimeout(timer);
    }, [query]);

    if (!isOpen) return null;

    const handleSelect = (item) => {
        const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        playClick();
        onClose();
        navigate(`/detail/${type}/${item.id}`);
    };

    const handleFullSearch = () => {
        if (query.trim()) {
            playClick();
            onClose();
            navigate(`/search/${encodeURIComponent(query.trim())}`);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleFullSearch();
        if (e.key === 'Escape') onClose();
    };

    return (
        <div className="search-modal-overlay open" onClick={(e) => e.target.classList.contains('search-modal-overlay') && onClose()}>
            <div className="search-modal-box">
                <div className="search-modal-header">
                    <i className="fas fa-search" style={{ color: 'var(--brand)', fontSize: '18px' }}></i>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search movies, TV series, anime, actors..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: '16px' }}><i className="fas fa-times"></i></button>
                </div>

                <div className="search-quick-tags">
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        <i className="fas fa-bolt"></i> Trending:
                    </span>
                    {['Marvel', 'Avatar', 'Spider-Man', 'Anime', 'Batman', 'Dune'].map(tag => (
                        <button key={tag} className="quick-tag" onClick={() => { setQuery(tag); }}>
                            {tag}
                        </button>
                    ))}
                </div>

                <div className="modal-results-container">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--cyan)', fontFamily: "'Space Grotesk', monospace" }}>
                            <i className="fas fa-spinner fa-spin"></i> QUERYING QUANTUM INDEX...
                        </div>
                    ) : results.length > 0 ? (
                        results.map(item => {
                            const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
                            const title = item.title || item.name || 'Untitled';
                            return (
                                <div key={item.id} className="modal-result-item" onClick={() => handleSelect(item)}>
                                    <img src={getPoster(item.poster_path)} className="modal-result-thumb" alt={title} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="modal-result-title">{title}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            <span style={{ background: 'var(--brand)', color: '#fff', fontSize: '9px', fontWeight: '800', padding: '1px 6px', borderRadius: '3px' }}>
                                                {type.toUpperCase()}
                                            </span>
                                            <span style={{ color: 'var(--gold)', fontWeight: '700' }}><i className="fas fa-star"></i> {getRating(item.vote_average)}</span>
                                            <span>•</span>
                                            <span>{getYear(item.release_date || item.first_air_date)}</span>
                                        </div>
                                    </div>
                                    <i className="fas fa-arrow-right" style={{ color: 'var(--text-muted)', fontSize: '12px' }}></i>
                                </div>
                            );
                        })
                    ) : query.trim() ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No instant preview found. Press <kbd className="cyber-kbd">Enter</kbd> for deep search.
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '35px', color: 'var(--text-muted)', fontSize: '13px' }}>
                            <i className="fas fa-terminal" style={{ marginRight: '6px' }}></i> Type a keyword or press <kbd className="cyber-kbd">Enter</kbd> to search everything
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
