import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWatchlist } from '../context/WatchlistContext';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Navbar({ onOpenSearch }) {
    const location = useLocation();
    const { count } = useWatchlist();
    const { enabled, toggleAudio, playClick } = useAudio();
    const { user, isAuthenticated, logout, openAuthModal } = useAuth();
    const [genres, setGenres] = useState([]);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openSub, setOpenSub] = useState(null);

    useEffect(() => {
        api.getGenres().then(res => {
            if (res && res.genres) setGenres(res.genres);
        });
    }, []);

    const toggleMobile = () => {
        setMobileOpen(!mobileOpen);
        playClick();
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && mobileOpen) {
                setMobileOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mobileOpen]);

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    return (
        <header className="site-header" id="siteHeader">
            {/* Top Bar */}
            <div className="header-top-bar">
                <div className="top-bar-content" style={{ justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="sound-toggle-btn" onClick={toggleAudio} title="Toggle Cyber Audio FX">
                            <i className={`fas fa-volume-${enabled ? 'up' : 'mute'}`}></i>
                            <span>AUDIO: {enabled ? 'ON' : 'OFF'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className="header-main">
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <button className="mobile-toggle" onClick={toggleMobile} aria-label="Toggle Menu" title="Open Navigation Drawer">
                        <i className="fas fa-bars" style={{ fontSize: '20px', color: '#fff' }}></i>
                    </button>

                    <Link to="/" className="cyber-logo-wrap" onClick={playClick}>
                        <div className="logo-top-badge">
                            <span className="logo-top-sparkle">✦</span>
                            <span className="logo-top-text">CYBERSTREAM 4K</span>
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
                </div>

                {/* Desktop Nav */}
                <nav className="main-nav-wrap">
                    <ul className="main-nav">
                        <li>
                            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={playClick}>
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link to="/collections" className={`nav-link ${location.pathname === '/collections' ? 'active' : ''}`} onClick={playClick}>
                                Discover
                            </Link>
                        </li>
                        <li>
                            <Link to="/watchlist" className={`nav-link ${location.pathname === '/watchlist' ? 'active' : ''}`} onClick={playClick}>
                                Watchlist
                                {count > 0 && <span className="watchlist-nav-pill">{count}</span>}
                            </Link>
                        </li>

                        {/* Genre Dropdown */}
                        <li className="has-dropdown">
                            <a href="#" className="nav-link" onClick={e => e.preventDefault()}>Genre <i className="fas fa-angle-down"></i></a>
                            <ul className="dropdown-menu cyber-dropdown">
                                {genres.map(g => (
                                    <li key={g.id}>
                                        <Link to={`/genre/${g.id}/${encodeURIComponent(g.name)}`} onClick={playClick}>
                                            {g.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </li>

                        {/* Categories Dropdown */}
                        <li className="has-dropdown">
                            <a href="#" className="nav-link" onClick={e => e.preventDefault()}>Category <i className="fas fa-angle-down"></i></a>
                            <ul className="dropdown-menu cyber-dropdown">
                                <li><Link to="/genre/0/Trending%20Today?endpoint=trending_day" onClick={playClick}><i className="fas fa-fire text-brand"></i> Trending Today</Link></li>
                                <li><Link to="/genre/0/Trending%20This%20Week?endpoint=trending" onClick={playClick}><i className="fas fa-bolt text-cyan"></i> Trending This Week</Link></li>
                                <li><Link to="/genre/0/Top%20Rated?endpoint=top_rated" onClick={playClick}><i className="fas fa-star text-gold"></i> Top Rated All-Time</Link></li>
                                <li><Link to="/genre/0/Hollywood?endpoint=hollywood" onClick={playClick}><i className="fas fa-film"></i> Hollywood Movies</Link></li>
                                <li><Link to="/genre/10749/Bollywood?endpoint=bollywood" onClick={playClick}><i className="fas fa-video"></i> Bollywood Pan-India</Link></li>
                                <li><Link to="/genre/0/KDrama?endpoint=kdrama" onClick={playClick}><i className="fas fa-heart text-purple"></i> Korean Wave (K-Drama)</Link></li>
                            </ul>
                        </li>

                        {/* OTT Streams Dropdown */}
                        <li className="has-dropdown">
                            <a href="#" className="nav-link" onClick={e => e.preventDefault()}>OTT Streams <i className="fas fa-angle-down"></i></a>
                            <ul className="dropdown-menu cyber-dropdown">
                                <li><Link to="/genre/0/Netflix?endpoint=netflix" onClick={playClick}><span className="ott-tag netflix">N</span> Netflix Originals</Link></li>
                                <li><Link to="/genre/0/Prime%20Video?endpoint=prime" onClick={playClick}><span className="ott-tag prime">P</span> Prime Video</Link></li>
                                <li><Link to="/genre/0/Disney+?endpoint=disney" onClick={playClick}><span className="ott-tag disney">D+</span> Disney+ Originals</Link></li>
                                <li><Link to="/genre/0/Apple%20TV+?endpoint=appletv" onClick={playClick}><span className="ott-tag apple"></span> Apple TV+</Link></li>
                                <li><Link to="/genre/0/HBO%20Max?endpoint=hbo" onClick={playClick}><span className="ott-tag hbo">HBO</span> HBO Max</Link></li>
                                <li><Link to="/genre/0/Paramount+?endpoint=paramount" onClick={playClick}><span className="ott-tag prime" style={{ background: '#0055ff' }}>P+</span> Paramount+</Link></li>
                            </ul>
                        </li>

                        {/* Universes Dropdown */}
                        <li className="has-dropdown">
                            <a href="#" className="nav-link" onClick={e => e.preventDefault()}>Universes <i className="fas fa-angle-down"></i></a>
                            <ul className="dropdown-menu cyber-dropdown">
                                <li><Link to="/genre/0/Marvel%20Cinematic%20Universe?endpoint=marvel" onClick={playClick}><i className="fas fa-shield-halved text-brand"></i> Marvel Cinematic (MCU)</Link></li>
                                <li><Link to="/genre/0/DC%20Universe%20%26%20DCEU?endpoint=dc" onClick={playClick}><i className="fas fa-mask" style={{ color: '#0055ff' }}></i> DC Universe (DCEU)</Link></li>
                                <li><Link to="/genre/0/Star%20Wars%20Galactic%20Universe?endpoint=starwars" onClick={playClick}><i className="fas fa-jedi" style={{ color: '#ffe81f' }}></i> Star Wars Saga</Link></li>
                                <li><Link to="/genre/0/Wizarding%20World?endpoint=wizarding_world" onClick={playClick}><i className="fas fa-wand-magic-sparkles" style={{ color: '#d4af37' }}></i> Wizarding World</Link></li>
                                <li><Link to="/genre/0/Legendary%20MonsterVerse?endpoint=monsterverse" onClick={playClick}><i className="fas fa-dragon" style={{ color: '#ff4500' }}></i> MonsterVerse</Link></li>
                                <li><Link to="/genre/0/Middle-earth%20Saga?endpoint=middle_earth" onClick={playClick}><i className="fas fa-ring" style={{ color: '#d4af37' }}></i> Middle-earth (LOTR)</Link></li>
                                <li><Link to="/genre/0/Spider-Verse%20%26%20SSU?endpoint=spider_verse" onClick={playClick}><i className="fas fa-spider" style={{ color: '#e50914' }}></i> Spider-Verse & SSU</Link></li>
                                <li><Link to="/genre/0/X-Men%20Mutant%20Universe?endpoint=xmen" onClick={playClick}><i className="fas fa-dna text-gold"></i> X-Men Universe</Link></li>
                                <li><Link to="/genre/0/Fast%20%26%20Furious%20Saga?endpoint=fast_and_furious" onClick={playClick}><i className="fas fa-car text-brand"></i> Fast Saga</Link></li>
                                <li><Link to="/genre/0/John%20Wick%20Universe?endpoint=john_wick" onClick={playClick}><i className="fas fa-crosshairs text-cyan"></i> John Wick Universe</Link></li>
                            </ul>
                        </li>
                    </ul>
                </nav>

                {/* Quick Search & Auth Triggers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button className="quick-search-trigger" onClick={onOpenSearch} title="Search (Ctrl + K)">
                        <i className="fas fa-search" style={{ color: 'var(--brand)' }}></i>
                        <span className="search-placeholder">Quick Search...</span>
                        <kbd className="cyber-kbd">Ctrl K</kbd>
                    </button>

                    {isAuthenticated && user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(0, 219, 233, 0.1)', border: '1px solid rgba(0, 219, 233, 0.3)', color: '#fff', fontSize: '13px', fontWeight: '600' }}>
                                <i className="fas fa-user-astronaut text-cyan"></i>
                                <span>{user.username}</span>
                            </div>
                            <button
                                onClick={logout}
                                title="Sign Out"
                                style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255, 81, 104, 0.1)', border: '1px solid rgba(255, 81, 104, 0.3)', color: 'var(--brand)', cursor: 'pointer', fontSize: '13px' }}
                            >
                                <i className="fas fa-right-from-bracket"></i>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => openAuthModal('login')}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--brand) 0%, #b81d24 100%)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 10px rgba(255,81,104,0.3)' }}
                        >
                            <i className="fas fa-shield-halved"></i>
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Cyber Side Navigation Drawer */}
            {mobileOpen && (
                <>
                    <div className="mobile-overlay open" onClick={toggleMobile}></div>
                    <aside className="mobile-menu open">
                        <div className="mobile-menu-header">
                            <Link to="/" className="cyber-logo-wrap" onClick={toggleMobile}>
                                <div className="logo-top-badge">
                                    <span className="logo-top-sparkle">✦</span>
                                    <span className="logo-top-text">CYBERSTREAM 4K</span>
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
                            <button className="mobile-close-btn" onClick={toggleMobile} aria-label="Close Side Drawer">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="mobile-drawer-body">
                            <div className="mobile-nav-group-title">MAIN NAVIGATION</div>
                            <ul className="mobile-nav">
                                <li><Link to="/" onClick={toggleMobile}><i className="fas fa-home text-brand"></i> Home Hub</Link></li>
                                <li><Link to="/collections" onClick={toggleMobile}><i className="fas fa-layer-group text-cyan"></i> Collections Hub</Link></li>
                                <li>
                                    <Link to="/watchlist" onClick={toggleMobile}>
                                        <i className="fas fa-heart text-brand"></i> My Watchlist
                                        {count > 0 && <span className="drawer-badge">{count}</span>}
                                    </Link>
                                </li>
                            </ul>

                            <div className="mobile-nav-group-title" style={{ marginTop: '20px' }}>FEATURED CATEGORIES</div>
                            <ul className="mobile-nav">
                                <li><Link to="/genre/0/Trending%20Today?endpoint=trending_day" onClick={toggleMobile}><i className="fas fa-fire text-brand"></i> Trending Today</Link></li>
                                <li><Link to="/genre/0/Top%20Rated?endpoint=top_rated" onClick={toggleMobile}><i className="fas fa-star text-gold"></i> Top Rated Movies</Link></li>
                                <li><Link to="/genre/0/Hollywood?endpoint=hollywood" onClick={toggleMobile}><i className="fas fa-film text-cyan"></i> Hollywood Cinema</Link></li>
                                <li><Link to="/genre/10749/Bollywood?endpoint=bollywood" onClick={toggleMobile}><i className="fas fa-video text-purple"></i> Bollywood Pan-India</Link></li>
                                <li><Link to="/genre/0/Anime%20Mega-Vault?endpoint=anime_hub" onClick={toggleMobile}><i className="fas fa-bolt text-gold"></i> Anime Vault</Link></li>
                            </ul>

                            <div className="mobile-nav-group-title" style={{ marginTop: '20px' }}>OTT HUB & UNIVERSES</div>
                            <ul className="mobile-nav">
                                <li><Link to="/genre/0/Netflix?endpoint=netflix" onClick={toggleMobile}><span className="ott-tag netflix">N</span> Netflix Originals</Link></li>
                                <li><Link to="/genre/0/Disney+?endpoint=disney" onClick={toggleMobile}><span className="ott-tag disney">D+</span> Disney+ Universe</Link></li>
                                <li><Link to="/genre/0/Marvel%20MCU?endpoint=marvel" onClick={toggleMobile}><i className="fas fa-shield-halved text-brand"></i> Marvel MCU</Link></li>
                                <li><Link to="/genre/0/DC%20Universe%20%26%20DCEU?endpoint=dc" onClick={toggleMobile}><i className="fas fa-mask" style={{ color: '#0055ff' }}></i> DC Universe</Link></li>
                            </ul>
                        </div>
                    </aside>
                </>
            )}
        </header>
    );
}
