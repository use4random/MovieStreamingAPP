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
                        <Link to="/" className="cyber-logo-wrap" onClick={playClick}>
                            <div className="logo-top-badge">
                                <span className="logo-top-sparkle">✦</span>
                                <span className="logo-top-text">CINESTREAM 4K</span>
                                <span className="logo-top-sparkle">✦</span>
                                <div className="logo-top-laser"></div>
                            </div>
                            <div className="logo-main-group">
                                <div className="logo-icon-box">
                                    <div className="logo-orbit-ring"></div>
                                    <i className="fas fa-play logo-play-icon"></i>
                                    <span className="logo-pulse-dot"></span>
                                </div>
                                <div className="logo-text">
                                    <span className="logo-cine">CINE</span>
                                    <span className="logo-pulse">PULSE</span>
                                </div>
                            </div>
                        </Link>
                        <p className="footer-desc">
                            <strong>Disclaimer:</strong> CinePulse is a next-generation streaming discovery engine & catalog index. Experience instant 4K cloud feeds, multi-node redundancy, dynamic season browsers, and futuristic HUD player.
                        </p>
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
                        <h4><i className="fas fa-shield-halved text-brand"></i> Legal & Disclaimer</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '12px' }}>
                            CinePulse operates as a high-performance content index and discovery engine. All media metadata, artwork, and details are dynamically retrieved via public API services. CinePulse does not host, store, or upload any media files on its servers.
                        </p>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div>
                        &copy; 2026 <strong>CinePulse</strong>. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
