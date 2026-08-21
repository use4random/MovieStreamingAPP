import React from 'react';
import { Link } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';

const HUBS = [
    { id: 'trending', label: 'All Trending', icon: 'fa-fire' },
    { id: 'trending_day', label: 'Trending Today', icon: 'fa-bolt' },
    { id: 'netflix', label: 'Netflix', pillClass: 'netflix-pill', icon: 'fa-circle-play' },
    { id: 'prime', label: 'Prime Video', pillClass: 'prime-pill', icon: 'fa-tv' },
    { id: 'disney', label: 'Disney+', pillClass: 'disney-pill', icon: 'fa-wand-magic-sparkles' },
    { id: 'hbo', label: 'HBO Max', icon: 'fa-film' },
    { id: 'anime_hub', label: 'Anime Vault', pillClass: 'anime-pill', icon: 'fa-dragon' },
    { id: 'marvel', label: 'Marvel MCU', pillClass: 'marvel-pill', icon: 'fa-shield-halved' },
    { id: 'kdrama', label: 'K-Drama', icon: 'fa-heart' },
    { id: 'bollywood', label: 'Bollywood', icon: 'fa-masks-theater' }
];

export default function MultiHubPills({ activeHub, onSelectHub }) {
    const { playClick } = useAudio();

    return (
        <div className="hub-filter-section fade-in">
            <div className="hub-filter-header">
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-satellite-dish text-brand" style={{ fontSize: '16px' }}></i>
                    Top Trending This Week
                </div>
                <Link to="/collections" style={{ color: 'var(--cyan)', fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>ALL COLLECTIONS</span>
                    <i className="fas fa-arrow-right" style={{ fontSize: '12px' }}></i>
                </Link>
            </div>
            <div className="hub-pills-scroll">
                {HUBS.map(h => (
                    <button
                        key={h.id}
                        className={`hub-pill ${h.pillClass || ''} ${activeHub === h.id ? 'active' : ''}`}
                        onClick={() => {
                            playClick();
                            onSelectHub(h.id);
                        }}
                    >
                        {h.icon && (
                            <i className={`fas ${h.icon}`} style={{ fontSize: '12px', marginRight: '6px' }}></i>
                        )}
                        {h.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
