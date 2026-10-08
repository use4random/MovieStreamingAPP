import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWatchlist } from '../context/WatchlistContext';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Navbar({ onOpenSearch }) {
    const location = useLocation();
    const { count } = useWatchlist();
    const { playClick } = useAudio();
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
            <div className="header-main">
                <div className="header-left-group">
                    <button className="mobile-toggle" onClick={toggleMobile} aria-label="Toggle Menu" title="Open Navigation Drawer">
                        <i className="fas fa-bars" style={{ fontSize: '18px', color: '#fff' }}></i>
                    </button>

                    {/* MultiMovies Style Logo */}
                    <Link to="/" className="multimovies-logo" onClick={playClick}>
                        <span className="logo-multi">MULTI</span>
                        <span className="logo-movies">MOVIES</span>
                    </Link>
                </div>

                {/* Capsule Center Nav */}
                <nav className="main-nav-wrap">
                    <div className="capsule-nav-bar">
                        <ul className="main-nav">
                            <li>
                                <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active-pill' : ''}`} onClick={playClick}>
                                    Home
                                </Link>
                            </li>
                            <li className="has-dropdown">
                                <a href="#" className="nav-link" onClick={e => e.preventDefault()}>Genre <i className="fas fa-chevron-down nav-arrow"></i></a>
                                <ul className="dropdown-menu pulse-dropdown">
                                    {genres.map(g => (
                                        <li key={g.id}>
                                            <Link to={`/genre/${g.id}/${encodeURIComponent(g.name)}`} onClick={playClick}>
                                                {g.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                            <li className="has-dropdown">
                                <a href="#" className="nav-link" onClick={e => e.preventDefault()}>Category <i className="fas fa-chevron-down nav-arrow"></i></a>
                                <ul className="dropdown-menu pulse-dropdown">
                                    <li><Link to="/genre/0/Trending%20Today?endpoint=trending_day" onClick={playClick}><i className="fas fa-fire text-brand"></i> Trending Today</Link></li>
                                    <li><Link to="/genre/0/Trending%20This%20Week?endpoint=trending" onClick={playClick}><i className="fas fa-bolt text-cyan"></i> Trending This Week</Link></li>
                                    <li><Link to="/genre/0/Top%20Rated?endpoint=top_rated" onClick={playClick}><i className="fas fa-star text-gold"></i> Top Rated All-Time</Link></li>
                                    <li><Link to="/genre/0/Hollywood?endpoint=hollywood" onClick={playClick}><i className="fas fa-film"></i> Hollywood Movies</Link></li>
                                    <li><Link to="/genre/10749/Bollywood?endpoint=bollywood" onClick={playClick}><i className="fas fa-video"></i> Bollywood Pan-India</Link></li>
                                    <li><Link to="/genre/0/KDrama?endpoint=kdrama" onClick={playClick}><i className="fas fa-heart text-purple"></i> Korean Wave (K-Drama)</Link></li>
                                </ul>
                            </li>
                            <li className="has-dropdown">
                                <a href="#" className="nav-link" onClick={e => e.preventDefault()}>OTT <i className="fas fa-chevron-down nav-arrow"></i></a>
                                <ul className="dropdown-menu pulse-dropdown">
                                    <li><Link to="/genre/0/Netflix?endpoint=netflix" onClick={playClick}><span className="ott-tag netflix">N</span> Netflix Originals</Link></li>
                                    <li><Link to="/genre/0/Prime%20Video?endpoint=prime" onClick={playClick}><span className="ott-tag prime">P</span> Prime Video</Link></li>
                                    <li><Link to="/genre/0/Disney+?endpoint=disney" onClick={playClick}><span className="ott-tag disney">D+</span> Disney+ Originals</Link></li>
                                    <li><Link to="/genre/0/Apple%20TV+?endpoint=appletv" onClick={playClick}><span className="ott-tag apple"></span> Apple TV+</Link></li>
                                    <li><Link to="/genre/0/HBO%20Max?endpoint=hbo" onClick={playClick}><span className="ott-tag hbo">HBO</span> HBO Max</Link></li>
                                </ul>
                            </li>
                            <li className="has-dropdown">
                                <a href="#" className="nav-link" onClick={e => e.preventDefault()}>Gen Z <i className="fas fa-chevron-down nav-arrow"></i></a>
                                <ul className="dropdown-menu pulse-dropdown">
                                    <li><Link to="/genre/0/Anime%20Mega-Vault?endpoint=anime_hub" onClick={playClick}><i className="fas fa-dragon text-gold"></i> Anime Vault</Link></li>
                                    <li><Link to="/genre/0/KDrama?endpoint=kdrama" onClick={playClick}><i className="fas fa-heart text-purple"></i> K-Drama Hits</Link></li>
                                </ul>
                            </li>
                            <li className="has-dropdown">
                                <a href="#" className="nav-link" onClick={e => e.preventDefault()}>Collection <i className="fas fa-chevron-down nav-arrow"></i></a>
                                <ul className="dropdown-menu pulse-dropdown">
                                    <li><Link to="/genre/0/Marvel%20Cinematic%20Universe?endpoint=marvel" onClick={playClick}><i className="fas fa-shield-halved text-brand"></i> Marvel MCU</Link></li>
                                    <li><Link to="/genre/0/DC%20Universe%20%26%20DCEU?endpoint=dc" onClick={playClick}><i className="fas fa-mask" style={{ color: '#0055ff' }}></i> DC Universe</Link></li>
                                    <li><Link to="/genre/0/Star%20Wars%20Galactic%20Universe?endpoint=starwars" onClick={playClick}><i className="fas fa-jedi" style={{ color: '#ffe81f' }}></i> Star Wars Saga</Link></li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </nav>

                {/* Right Action Icons */}
                <div className="header-right-group">
                    <button className="circle-action-btn" onClick={onOpenSearch} title="Search Content">
                        <i className="fas fa-search"></i>
                    </button>
                    <Link to="/watchlist" className="circle-action-btn" title="Saved Watchlist" onClick={playClick}>
                        <i className="fas fa-bookmark"></i>
                        {count > 0 && <span className="circle-badge">{count}</span>}
                    </Link>
                    {isAuthenticated && user ? (
                        <button className="circle-action-btn active-user-btn" onClick={logout} title={`Sign Out (${user.username})`}>
                            <i className="fas fa-user-check" style={{ color: 'var(--cyan)' }}></i>
                        </button>
                    ) : (
                        <button className="circle-action-btn" onClick={() => openAuthModal('login')} title="Sign In / Account">
                            <i className="fas fa-sliders-h"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* Side Navigation Drawer */}
            {mobileOpen && (
                <>
                    <div className="mobile-overlay open" onClick={toggleMobile}></div>
                    <aside className="mobile-menu open">
                        <div className="mobile-menu-header">
                            <Link to="/" className="pulse-logo-wrap" onClick={toggleMobile}>
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
                            <button className="mobile-close-btn" onClick={toggleMobile} aria-label="Close Side Drawer">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="mobile-drawer-body">
                            {isAuthenticated && user ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', background: 'rgba(0, 219, 233, 0.08)', border: '1px solid rgba(0, 219, 233, 0.25)', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                                        <i className="fas fa-user-astronaut text-cyan" style={{ fontSize: '16px' }}></i>
                                        <span>{user.username}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { toggleMobile(); logout(); }}
                                        style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255, 81, 104, 0.15)', border: '1px solid rgba(255, 81, 104, 0.4)', color: 'var(--brand)', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                    <button
                                        type="button"
                                        onClick={() => { toggleMobile(); openAuthModal('login'); }}
                                        className="mobile-drawer-auth-btn mobile-drawer-signin"
                                    >
                                        <i className="fas fa-right-to-bracket"></i>
                                        <span>Sign In</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { toggleMobile(); openAuthModal('register'); }}
                                        className="mobile-drawer-auth-btn mobile-drawer-signup"
                                    >
                                        <i className="fas fa-user-plus"></i>
                                        <span>Sign Up</span>
                                    </button>
                                </div>
                            )}

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
