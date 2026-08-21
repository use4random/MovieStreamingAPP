import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBackdropLarge, getRating, getYear } from '../services/api';
import { useWatchlist } from '../context/WatchlistContext';
import { useAudio } from '../context/AudioContext';

export default function HeroCarousel({ items }) {
    const [index, setIndex] = useState(0);
    const navigate = useNavigate();
    const { has, toggle } = useWatchlist();
    const { playWhoosh, playClick } = useAudio();
    const timerRef = useRef(null);

    const slides = (items || []).slice(0, 8);

    useEffect(() => {
        if (slides.length === 0) return;
        timerRef.current = setInterval(() => {
            setIndex(prev => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timerRef.current);
    }, [slides.length]);

    if (!slides || slides.length === 0) return null;

    const moveSlide = (dir) => {
        playWhoosh();
        setIndex(prev => (prev + dir + slides.length) % slides.length);
    };

    const goToSlide = (i) => {
        playClick();
        setIndex(i);
    };

    return (
        <div
            className="carousel-section"
            onMouseEnter={() => clearInterval(timerRef.current)}
            onMouseLeave={() => {
                clearInterval(timerRef.current);
                timerRef.current = setInterval(() => setIndex(prev => (prev + 1) % slides.length), 6000);
            }}
        >
            <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
                {slides.map((item, i) => {
                    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
                    const isTV = type === 'tv';
                    const title = item.title || item.name || 'Featured Premiere';
                    const backdropUrl = getBackdropLarge(item.backdrop_path);
                    const itemRating = getRating(item.vote_average);
                    const itemYear = getYear(item.release_date || item.first_air_date);

                    return (
                        <div
                            key={item.id}
                            className="carousel-slide"
                            onClick={() => {
                                playClick();
                                navigate(`/detail/${type}/${item.id}`);
                            }}
                        >
                            <img src={backdropUrl} alt={title} loading={i === 0 ? 'eager' : 'lazy'} />
                            <div className="slide-overlay">
                                <div className="slide-info">
                                    <div className="slide-badges" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                        <span className="badge-cyber" style={{ background: 'var(--primary-container)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <i className="fas fa-fire" style={{ fontSize: '11px' }}></i>
                                            {isTV ? 'Featured Series' : 'Featured Premiere'}
                                        </span>
                                        <span className="badge-rating glass-panel" style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '700', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <i className="fas fa-star" style={{ fontSize: '11px', color: '#fbbf24' }}></i>
                                            {itemRating}
                                        </span>
                                        <span className="glass-panel" style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                                            {itemYear}
                                        </span>
                                        <span className="glass-panel" style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '800', color: 'var(--cyan)' }}>
                                            4K ULTRA
                                        </span>
                                    </div>
                                    <h1 className="slide-title" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', textShadow: '0 4px 16px rgba(0,0,0,0.8)' }}>{title}</h1>
                                    <p className="slide-desc" style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>{item.overview || 'Explore the ultimate cinematic experience in 4K resolution on CinePulse.'}</p>
                                    <div className="slide-actions" style={{ marginTop: '24px', display: 'flex', gap: '14px' }}>
                                        <button
                                            className="glow-button"
                                            style={{
                                                background: 'var(--brand)',
                                                color: '#fff',
                                                padding: '12px 28px',
                                                borderRadius: '8px',
                                                fontFamily: 'var(--font-heading)',
                                                fontSize: '15px',
                                                fontWeight: '700',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playClick();
                                                navigate(`/detail/${type}/${item.id}`);
                                            }}
                                        >
                                            <i className="fas fa-play" style={{ fontSize: '13px' }}></i>
                                            Stream Now
                                        </button>
                                        <button
                                            className="glass-panel"
                                            style={{
                                                padding: '12px 24px',
                                                borderRadius: '8px',
                                                color: has(item.id) ? 'var(--brand-light)' : '#fff',
                                                borderColor: has(item.id) ? 'var(--brand)' : 'rgba(255,255,255,0.1)',
                                                fontFamily: 'var(--font-heading)',
                                                fontSize: '15px',
                                                fontWeight: '600',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playClick();
                                                toggle(item);
                                            }}
                                        >
                                            <i className={`fas ${has(item.id) ? 'fa-check' : 'fa-plus'}`} style={{ fontSize: '13px' }}></i>
                                            {has(item.id) ? 'In Watchlist' : 'Watchlist'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation Arrows */}
            <button className="carousel-arrow carousel-arrow-left" onClick={() => handleNav('prev')} aria-label="Previous Slide">
                <i className="fas fa-chevron-left" style={{ fontSize: '14px' }}></i>
            </button>
            <button className="carousel-arrow carousel-arrow-right" onClick={() => handleNav('next')} aria-label="Next Slide">
                <i className="fas fa-chevron-right" style={{ fontSize: '14px' }}></i>
            </button>

            <div className="carousel-timeline">
                {slides.map((_, i) => (
                    <div
                        key={i}
                        className={`timeline-dot ${i === index ? 'active' : ''}`}
                        onClick={() => goToSlide(i)}
                    ></div>
                ))}
            </div>
        </div>
    );
}
