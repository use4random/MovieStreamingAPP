import React from 'react';
import { Link } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';

const HUBS = [
    { id: 'trending', label: 'All Trending', icon: 'local_fire_department' },
    { id: 'trending_day', label: 'Trending Today', icon: 'bolt' },
    { id: 'netflix', label: 'Netflix', pillClass: 'netflix-pill', icon: 'play_circle' },
    { id: 'prime', label: 'Prime Video', pillClass: 'prime-pill', icon: 'smart_display' },
    { id: 'disney', label: 'Disney+', pillClass: 'disney-pill', icon: 'auto_awesome' },
    { id: 'hbo', label: 'HBO Max', icon: 'movie' },
    { id: 'anime_hub', label: 'Anime Vault', pillClass: 'anime-pill', icon: 'animation' },
    { id: 'marvel', label: 'Marvel MCU', pillClass: 'marvel-pill', icon: 'shield' },
    { id: 'kdrama', label: 'K-Drama', icon: 'favorite' },
    { id: 'bollywood', label: 'Bollywood', icon: 'celebration' }
];

export default function MultiHubPills({ activeHub, onSelectHub }) {
    const { playClick } = useAudio();

    return (
        <div className="hub-filter-section fade-in">
            <div className="hub-filter-header">
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--brand)', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>satellite_alt</span>
                    Top Trending This Week
                </div>
                <Link to="/collections" style={{ color: 'var(--cyan)', fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>ALL COLLECTIONS</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
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
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                {h.icon}
                            </span>
                        )}
                        {h.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
