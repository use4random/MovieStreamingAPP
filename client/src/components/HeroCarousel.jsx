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
            style={{ borderRadius: '20px', overflow: 'hidden', marginBottom: '36px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
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
                            <div className="slide-overlay" style={{ background: 'linear-gradient(180deg, rgba(5,5,5,0.2) 0%, rgba(5,5,5,0.7) 60%, rgba(5,5,5,0.98) 100%), linear-gradient(90deg, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.6) 50%, transparent 100%)' }}>
                                <div className="slide-info" style={{ maxWidth: '640px', padding: '0 40px' }}>
                                    
                                    {/* Red Accent Dash + Section Subtitle */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                        <span style={{ width: '28px', height: '3px', background: '#E50914', borderRadius: '2px', boxShadow: '0 0 10px rgba(229,9,20,0.6)' }}></span>
                                        <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '2px', color: '#e5e5e5', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                            — LATEST UPDATES
                                        </span>
                                    </div>

                                    {/* Massive Bold Title */}
                                    <h1 className="slide-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '52px', fontWeight: '900', letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '14px', lineHeight: '1.08', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}>
                                        {title}
                                    </h1>

                                    {/* Clean Metadata Line: Rating, Year, Type, Quality */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', fontSize: '14px', fontWeight: '700' }}>
                                        <span style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <i className="fas fa-star" style={{ fontSize: '13px' }}></i>
                                            {itemRating}
                                        </span>
                                        <span style={{ color: 'rgba(255,255,255,0.8)' }}>{itemYear}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.8)' }}>{isTV ? 'Series' : 'Movie'}</span>
                                        <span style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                                            1080p
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="slide-desc" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: '1.65', marginBottom: '28px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {item.overview || 'When a mysterious force threatens humanity, an unlikely hero steps up to protect their close-knit community in this high-octane streaming release.'}
                                    </p>

                                    {/* Buttons Group (Matching multimovies.garden) */}
                                    <div className="slide-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <button
                                            style={{
                                                background: '#ffffff',
                                                color: '#000000',
                                                padding: '13px 26px',
                                                borderRadius: '10px',
                                                fontFamily: 'var(--font-heading)',
                                                fontSize: '14px',
                                                fontWeight: '800',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 20px rgba(255,255,255,0.3)',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playClick();
                                                navigate(`/detail/${type}/${item.id}`);
                                            }}
                                        >
                                            <i className="fas fa-play" style={{ fontSize: '12px', color: '#000' }}></i>
                                            <span>{isTV ? 'Explore episodes' : 'Stream Movie'}</span>
                                        </button>

                                        <button
                                            style={{
                                                background: 'rgba(18, 20, 26, 0.75)',
                                                backdropFilter: 'blur(12px)',
                                                color: '#ffffff',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                padding: '13px 22px',
                                                borderRadius: '10px',
                                                fontFamily: 'var(--font-heading)',
                                                fontSize: '14px',
                                                fontWeight: '700',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playClick();
                                                navigate(`/detail/${type}/${item.id}`);
                                            }}
                                        >
                                            <i className="fas fa-circle-info" style={{ fontSize: '14px' }}></i>
                                            <span>More Info</span>
                                        </button>

                                        <button
                                            style={{
                                                width: '46px',
                                                height: '46px',
                                                borderRadius: '10px',
                                                background: has(item.id) ? 'rgba(229, 9, 20, 0.2)' : 'rgba(18, 20, 26, 0.75)',
                                                backdropFilter: 'blur(12px)',
                                                border: has(item.id) ? '1px solid #E50914' : '1px solid rgba(255, 255, 255, 0.18)',
                                                color: has(item.id) ? '#ff5168' : '#ffffff',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '16px',
                                                cursor: 'pointer'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playClick();
                                                toggle(item);
                                            }}
                                            title={has(item.id) ? 'In Watchlist' : 'Add to Watchlist'}
                                        >
                                            <i className={`fas ${has(item.id) ? 'fa-check' : 'fa-plus'}`}></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Carousel Footer Navigation Bar (Matching multimovies.garden index counter & segmented bar) */}
            <div style={{ position: 'absolute', bottom: '20px', left: '40px', right: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
                {/* Index Counter + Segmented Dash Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: '800' }}>
                        {String(index + 1).padStart(2, '0')}<span style={{ color: 'rgba(255,255,255,0.4)' }}> / {String(slides.length).padStart(2, '0')}</span>
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {slides.map((_, i) => (
                            <div
                                key={i}
                                onClick={() => goToSlide(i)}
                                style={{
                                    height: '3px',
                                    width: i === index ? '32px' : '14px',
                                    background: i === index ? '#ffffff' : 'rgba(255, 255, 255, 0.25)',
                                    borderRadius: '2px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            ></div>
                        ))}
                    </div>
                </div>

                {/* Circular Arrow Navigation Buttons */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={() => moveSlide(-1)}
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'rgba(18, 20, 26, 0.75)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        aria-label="Previous Slide"
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <button
                        onClick={() => moveSlide(1)}
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'rgba(18, 20, 26, 0.75)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        aria-label="Next Slide"
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}
