import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import SearchModal from './components/SearchModal';
import MobileBottomNav from './components/MobileBottomNav';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import SearchPage from './pages/SearchPage';
import GenrePage from './pages/GenrePage';
import CollectionsPage from './pages/CollectionsPage';
import WatchlistPage from './pages/WatchlistPage';

export default function App() {
    const [searchOpen, setSearchOpen] = useState(false);
    const location = useLocation();

    // Global Anti-Popunder & Ad Interceptor for Third-Party Embeds
    useEffect(() => {
        // 1. Override window.open
        const nativeOpen = window.open;
        window.open = function (url, target, features) {
            if (!url || typeof url !== 'string') return null;
            if (url.startsWith('/') || url.includes(window.location.hostname)) {
                return nativeOpen.call(window, url, target, features);
            }
            console.warn('[Popunder Shield] Blocked window.open ad popup:', url);
            return null;
        };

        // 2. Override HTMLAnchorElement.prototype.click to catch dynamic hidden anchor creation
        const nativeAnchorClick = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function () {
            const href = this.getAttribute('href') || this.href;
            if (href && typeof href === 'string' && !href.startsWith('/') && !href.includes(window.location.hostname) && (this.target === '_blank' || href.startsWith('http'))) {
                console.warn('[Popunder Shield] Blocked dynamic anchor element ad click:', href);
                return;
            }
            return nativeAnchorClick.apply(this, arguments);
        };

        // 3. Capture-phase window click listener to trap click-jacking popunders
        const handleGlobalClick = (e) => {
            const target = e.target;
            if (target && target.tagName === 'A') {
                const href = target.getAttribute('href') || target.href;
                if (href && typeof href === 'string' && (target.target === '_blank' || href.startsWith('http')) && !href.startsWith('/') && !href.includes(window.location.hostname)) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.warn('[Popunder Shield] Intercepted link popunder click:', href);
                }
            }
        };

        window.addEventListener('click', handleGlobalClick, true);

        return () => {
            window.open = nativeOpen;
            HTMLAnchorElement.prototype.click = nativeAnchorClick;
            window.removeEventListener('click', handleGlobalClick, true);
        };
    }, []);


    // Ctrl+K shortcut for search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


    // Close search on route change
    useEffect(() => {
        setSearchOpen(false);
    }, [location.pathname]);

    return (
        <>
            <Navbar onOpenSearch={() => setSearchOpen(true)} />

            <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

            <div className="site-container">
                <main className="main-content" id="mainContent">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/detail/:type/:id" element={<DetailPage />} />
                        <Route path="/search/:query" element={<SearchPage />} />
                        <Route path="/genre/:genreId/:name" element={<GenrePage />} />
                        <Route path="/collections" element={<CollectionsPage />} />
                        <Route path="/watchlist" element={<WatchlistPage />} />
                    </Routes>
                </main>
                <Sidebar />
            </div>

            <Footer />

            <MobileBottomNav onOpenSearch={() => setSearchOpen(true)} />

            <BackToTop />
        </>
    );
}

function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => setVisible(window.scrollY > 300);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <button
            className={`back-to-top ${visible ? 'visible' : ''}`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
        >
            <i className="fas fa-arrow-up"></i>
        </button>
    );
}
