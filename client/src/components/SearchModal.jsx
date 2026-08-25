import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useQueryClient } from '@tanstack/react-query';
import { api, getPoster, getRating, getYear } from '../services/api';
import { useAudio } from '../context/AudioContext';

const TRENDING_TAGS = ['Marvel', 'Avatar', 'Spider-Man', 'Anime', 'Batman', 'Dune'];

export default function SearchModal({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const inputRef = useRef(null);
    const resultsContainerRef = useRef(null);
    const navigate = useNavigate();
    const { playClick, playWhoosh } = useAudio();
    const queryClient = useQueryClient();

    // ── Build Fuse.js index from cached trending data for 0ms instant preview ──
    const fuseIndex = useMemo(() => {
        const cached = queryClient.getQueryData(['trending', 'all', 'week']);
        const items = cached?.results || [];
        if (!items.length) return null;
        return new Fuse(items, {
            keys: ['title', 'name', 'original_title'],
            threshold: 0.3,
            includeScore: true,
        });
    }, [queryClient, isOpen]);

    // Reset and autofocus on open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
            setSelectedIndex(-1);
            setLoading(false);
            const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
            playWhoosh();
            return () => clearTimeout(focusTimer);
        }
    }, [isOpen]);

    // ── Debounced Search with Race Condition Protection ──
    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed || trimmed.length < 2) {
            setResults([]);
            setSelectedIndex(-1);
            setLoading(false);
            return;
        }

        let isCurrent = true;

        // Instant local cache hit
        if (fuseIndex) {
            const localHits = fuseIndex.search(trimmed, { limit: 6 });
            if (localHits.length > 0 && isCurrent) {
                setResults(localHits.map(r => r.item));
            }
        }

        // Live API Search
        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const data = await api.search(trimmed, 1);
                if (isCurrent && data?.results) {
                    setResults(data.results.slice(0, 6));
                    setSelectedIndex(-1);
                }
            } catch (err) {
                console.error('[SearchModal] API Search failed:', err);
            } finally {
                if (isCurrent) setLoading(false);
            }
        }, 300);

        return () => {
            isCurrent = false;
            clearTimeout(timer);
        };
    }, [query, fuseIndex]);

    const handleSelect = useCallback((item) => {
        if (!item) return;
        const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        playClick();
        onClose();
        navigate(`/detail/${type}/${item.id}`);
    }, [navigate, onClose, playClick]);

    const handleFullSearch = useCallback(() => {
        const trimmed = query.trim();
        if (trimmed) {
            playClick();
            onClose();
            navigate(`/search/${encodeURIComponent(trimmed)}`);
        }
    }, [query, navigate, onClose, playClick]);

    // ── Keyboard Navigation across results ──
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (results.length > 0 ? (prev + 1) % results.length : -1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (results.length > 0 ? (prev - 1 + results.length) % results.length : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && results[selectedIndex]) {
                handleSelect(results[selectedIndex]);
            } else {
                handleFullSearch();
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="search-modal-overlay open"
            onClick={(e) => e.target.classList.contains('search-modal-overlay') && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label="Search Catalog"
        >
            <div className="search-modal-box">
                <div className="search-modal-header">
                    <i className="fas fa-search" style={{ color: 'var(--brand)', fontSize: '18px' }} aria-hidden="true"></i>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search movies, TV series, anime, actors..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        aria-label="Search query"
                        autoComplete="off"
                        spellCheck="false"
                    />
                    <button onClick={onClose} aria-label="Close search" style={{ color: 'var(--text-muted)', fontSize: '16px', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="search-quick-tags">
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        <i className="fas fa-bolt"></i> Trending:
                    </span>
                    {TRENDING_TAGS.map(tag => (
                        <button
                            key={tag}
                            className="quick-tag"
                            onClick={() => {
                                setQuery(tag);
                                inputRef.current?.focus();
                            }}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                <div className="modal-results-container" ref={resultsContainerRef} role="listbox">
                    {loading && results.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--cyan)', fontFamily: "'Space Grotesk', monospace" }}>
                            <i className="fas fa-spinner fa-spin"></i> SEARCHING LIVE INDEX...
                        </div>
                    ) : results.length > 0 ? (
                        results.map((item, idx) => {
                            const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
                            const title = item.title || item.name || 'Untitled';
                            const isSelected = idx === selectedIndex;
                            return (
                                <div
                                    key={`${type}-${item.id}`}
                                    className={`modal-result-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleSelect(item)}
                                    role="option"
                                    aria-selected={isSelected}
                                    style={isSelected ? { background: 'rgba(255, 81, 104, 0.15)', borderColor: 'var(--brand)' } : {}}
                                >
                                    <img src={getPoster(item.poster_path)} className="modal-result-thumb" alt={title} loading="lazy" />
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
                                    <i className="fas fa-arrow-right" style={{ color: isSelected ? 'var(--brand)' : 'var(--text-muted)', fontSize: '12px' }}></i>
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
