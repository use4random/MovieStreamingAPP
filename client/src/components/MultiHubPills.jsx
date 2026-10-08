import React from 'react';
import { useAudio } from '../context/AudioContext';

const NETWORKS = [
    {
        id: 'prime',
        name: 'Amazon Prime',
        tag: 'Amazon Prime >',
        logo: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#00A8E1', fontFamily: 'sans-serif', letterSpacing: '-0.02em' }}>
                    prime video
                </span>
                <div style={{ width: '38px', height: '3px', background: '#00A8E1', borderRadius: '2px', marginTop: '1px' }}></div>
            </div>
        )
    },
    {
        id: 'hotstar',
        name: 'Jio Hotstar',
        tag: 'Jio Hotstar >',
        logo: (
            <div style={{ background: '#fff', padding: '4px 12px', borderRadius: '4px', color: '#000', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-play" style={{ fontSize: '10px', color: '#000' }}></i> JioHotstar
            </div>
        )
    },
    {
        id: 'jio',
        name: 'Jio OTT',
        tag: 'Jio OTT >',
        logo: (
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0F52BA', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px' }}>
                Jio
            </div>
        )
    },
    {
        id: 'kdrama',
        name: 'K-drama',
        tag: 'K-drama >',
        logo: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF69B4', fontWeight: '700', fontSize: '13px' }}>
                <i className="fas fa-heart" style={{ fontSize: '16px' }}></i> K-drama collection
            </div>
        )
    },
    {
        id: 'mxplayer',
        name: 'MX Player',
        tag: 'MX Player >',
        logo: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontWeight: '800', fontSize: '15px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0088FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-play" style={{ fontSize: '9px', color: '#fff', marginLeft: '1px' }}></i>
                </div>
                MXPLAYER
            </div>
        )
    },
    {
        id: 'netflix',
        name: 'Netflix',
        tag: 'Netflix >',
        logo: (
            <span style={{ fontSize: '22px', fontWeight: '900', color: '#E50914', letterSpacing: '2px', fontFamily: 'sans-serif' }}>
                NETFLIX
            </span>
        )
    },
    {
        id: 'sonyliv',
        name: 'Sony Liv',
        tag: 'Sony Liv >',
        logo: (
            <div style={{ background: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)', padding: '3px 8px', borderRadius: '4px', color: '#fff', fontWeight: '900', fontSize: '12px' }}>
                SONY liv
            </div>
        )
    },
    {
        id: 'zee5',
        name: 'Zee 5',
        tag: 'Zee 5 >',
        logo: (
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff', letterSpacing: '-1px' }}>
                Z<span style={{ color: '#00DBE9' }}>5</span>
            </div>
        )
    }
];

export default function MultiHubPills({ activeHub, onSelectHub }) {
    const { playClick } = useAudio();

    return (
        <div className="network-browse-section fade-in">
            <h2 className="network-section-title">Browse by network</h2>
            <div className="network-cards-grid">
                {NETWORKS.map(net => (
                    <div
                        key={net.id}
                        className={`network-card ${activeHub === net.id ? 'active' : ''}`}
                        onClick={() => {
                            playClick();
                            onSelectHub(net.id);
                        }}
                    >
                        <div className="network-card-logo">
                            {net.logo}
                        </div>
                        <div className="network-card-tag">
                            {net.tag}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

