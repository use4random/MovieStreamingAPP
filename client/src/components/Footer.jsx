import React from 'react';
import { Link } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';

export default function Footer() {
    const { playClick } = useAudio();

    return (
        <footer className="site-footer">
            <div className="footer-inner">
                <div className="footer-grid">
                    <div className="footer-col">
                        <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(255,81,104,0.2) 0%, rgba(0,219,233,0.2) 100%)', border: '1px solid rgba(255,81,104,0.4)' }}>
                                <i className="fas fa-play" style={{ fontSize: '12px', color: 'var(--brand)', marginLeft: '1px' }}></i>
                            </div>
                            <span style={{ fontSize: '20px', fontFamily: 'var(--font-heading)', fontWeight: '800', letterSpacing: '-0.02em' }}>
                                <span style={{ color: '#fff' }}>CINE</span><span style={{ background: 'linear-gradient(135deg, #ff5168 0%, #00dbe9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PULSE</span>
                            </span>
                        </div>
                        <p className="footer-desc">
                            Next-generation full-stack streaming ecosystem. Experience instant 4K cloud feeds, multi-node redundancy, dynamic season browsers, and futuristic cyber HUD player.
                        </p>
                        <div className="footer-status-pill">
                            <span className="pulse-dot"></span> CINEPULSE CLOUD ENGINE ONLINE
                        </div>
                    </div>

                    <div className="footer-col">
                        <h4><i className="fas fa-compass text-brand"></i> Quick Explore</h4>
                        <ul>
                            <li><Link to="/genre/0/Trending%20Today?endpoint=trending_day" onClick={playClick}>Trending Streams</Link></li>
                            <li><Link to="/genre/0/Top%20Rated?endpoint=top_rated" onClick={playClick}>Top Rated Cinema</Link></li>
                            <li><Link to="/genre/28/Action?mediaType=movie" onClick={playClick}>Action Movies</Link></li>
                            <li><Link to="/collections" onClick={playClick}>Collections Hub</Link></li>
                            <li><Link to="/watchlist" onClick={playClick}>My Saved Watchlist</Link></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4><i className="fas fa-layer-group text-brand"></i> OTT Channels</h4>
                        <ul>
                            <li><Link to="/genre/0/Netflix?endpoint=netflix" onClick={playClick}>Netflix Series</Link></li>
                            <li><Link to="/genre/0/Marvel%20MCU?endpoint=marvel" onClick={playClick}>Marvel MCU</Link></li>
                            <li><Link to="/genre/0/Disney+?endpoint=disney" onClick={playClick}>Disney+ Originals</Link></li>
                            <li><Link to="/genre/0/Anime%20Mega-Vault?endpoint=anime_hub" onClick={playClick}>Anime Hub</Link></li>
                            <li><Link to="/genre/0/HBO%20Max?endpoint=hbo" onClick={playClick}>HBO Max Exclusives</Link></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4><i className="fas fa-shield-halved text-brand"></i> Legal & Architecture</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '12px' }}>
                            Educational exploration interface. Built with React 18, Vite, and Node.js Express. All media metadata provided via public TMDB API.
                        </p>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div>
                        &copy; 2026 <strong>CinePulse Cyber Edition</strong>. All rights reserved.
                    </div>
                    <div className="latency-chip">
                        <i className="fas fa-bolt"></i> Backend Latency: <strong>4ms</strong>
                    </div>
                </div>
            </div>
        </footer>
    );
}
