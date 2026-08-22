import React, { useEffect, useRef, useState } from 'react';
import { ENABLE_ADS, AD_CONFIG } from '../config/ads';

// Temporary Cyber Ad Templates for realistic preview
const TEMPORARY_ADS = {
    sidebar: {
        title: 'CYBER SHIELD VPN 2026',
        desc: 'Encrypted Streaming & Zero Logs. 75% OFF + 3 Months Free.',
        badge: 'SPONSORED',
        cta: 'CLAIM OFFER',
        icon: 'fa-shield-halved',
        color: 'linear-gradient(135deg, rgba(0,219,233,0.15) 0%, rgba(255,81,104,0.15) 100%)',
        borderColor: 'rgba(0,219,233,0.4)',
        link: '#'
    },
    player: {
        title: 'QUANTUM FIBER 10 Gbps',
        desc: 'Ultra Low Latency 4K HDR Bufferless Streaming',
        badge: 'STREAM PARTNER',
        cta: 'UPGRADE NET',
        icon: 'fa-bolt',
        color: 'linear-gradient(135deg, rgba(255,81,104,0.15) 0%, rgba(138,43,226,0.15) 100%)',
        borderColor: 'rgba(255,81,104,0.4)',
        link: '#'
    },
    header: {
        title: 'CINEPULSE PRO PASS',
        desc: 'Unlock 4K Ultra IMAX & Zero Ad Buffering',
        badge: 'PREMIUM',
        cta: 'GO PRO',
        icon: 'fa-crown',
        color: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,81,104,0.15) 100%)',
        borderColor: 'rgba(255,215,0,0.4)',
        link: '#'
    }
};

export default function AdBanner({ 
    format = 'sidebar', 
    adClient = AD_CONFIG.adSenseClient, 
    adSlot = '', 
    scriptSrc = '',
    customHtml = '' 
}) {
    const [dismissed, setDismissed] = useState(false);
    const bannerRef = useRef(null);

    // 💡 ONE-LINE MASTER SWITCH: Return null if ENABLE_ADS is set to false in src/config/ads.js
    if (!ENABLE_ADS || dismissed) return null;

    const adData = TEMPORARY_ADS[format] || TEMPORARY_ADS.sidebar;

    return (
        <div 
            className={`cyber-ad-banner cyber-ad-${format}`}
            style={{
                position: 'relative',
                margin: '16px 0',
                width: '100%',
                padding: format === 'sidebar' ? '18px 16px' : '14px 20px',
                borderRadius: '12px',
                background: adData.color,
                border: `1px solid ${adData.borderColor}`,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 15px rgba(255,81,104,0.1)',
                display: 'flex',
                flexDirection: format === 'sidebar' ? 'column' : 'row',
                alignItems: format === 'sidebar' ? 'stretch' : 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxSizing: 'border-box'
            }}
        >
            {/* Top Bar Label & Dismiss Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    color: 'var(--cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0, 219, 233, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 219, 233, 0.25)'
                }}>
                    <i className={`fas ${adData.icon}`}></i> {adData.badge}
                </span>

                <button
                    onClick={() => setDismissed(true)}
                    title="Hide Advertisement"
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'color 0.2s'
                    }}
                >
                    <i className="fas fa-xmark"></i>
                </button>
            </div>

            {/* Ad Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{
                    margin: '6px 0 4px 0',
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#ffffff',
                    letterSpacing: '0.5px'
                }}>
                    {adData.title}
                </h4>
                <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    lineHeight: '1.4'
                }}>
                    {adData.desc}
                </p>
            </div>

            {/* CTA Action Button */}
            <a
                href={adData.link}
                onClick={(e) => e.preventDefault()}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--brand) 0%, #b81d24 100%)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.8px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(255, 81, 104, 0.3)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    alignSelf: format === 'sidebar' ? 'flex-start' : 'center'
                }}
            >
                <span>{adData.cta}</span>
                <i className="fas fa-arrow-right" style={{ fontSize: '10px' }}></i>
            </a>
        </div>
    );
}
