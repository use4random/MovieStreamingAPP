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

    // Global Anti-Popunder & Strict Mobile Ad Interceptor
    useEffect(() => {
        const isInternalUrl = (url) => {
            if (!url || typeof url !== 'string') return false;
            if (url.startsWith('/') || url.startsWith('#') || url.startsWith('javascript:void') || url.startsWith('blob:')) return true;
            try {
                const parsed = new URL(url, window.location.origin);
                return parsed.hostname === window.location.hostname;
            } catch {
                return false;
            }
        };

        // Dummy window object to safely swallow ad script method calls (.focus(), .blur(), .close())
        const dummyWindow = {
            focus: () => {},
            blur: () => {},
            close: () => {},
            postMessage: () => {},
            location: { href: '' }
        };

        // 1. Override window.open to trap all popup attempts across mobile and desktop
        const nativeOpen = window.open;
        window.open = function (url, target, features) {
            if (url && isInternalUrl(url)) {
                return nativeOpen.call(window, url, target, features);
            }
            console.warn('[Popunder Shield] Blocked external window.open popup attempt:', url || 'empty_url');
            return dummyWindow;
        };

        // 2. Override HTMLAnchorElement.prototype.click to catch dynamic hidden anchor insertions
        const nativeAnchorClick = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function () {
            const href = this.getAttribute('href') || this.href;
            if (href && !isInternalUrl(href) && (this.target === '_blank' || (typeof href === 'string' && href.startsWith('http')))) {
                console.warn('[Popunder Shield] Blocked dynamic anchor ad click:', href);
                return;
            }
            return nativeAnchorClick.apply(this, arguments);
        };

        // 3. Capture-phase listener for click and mobile touch events to trap click-jacking popunders
        const handleGlobalEvent = (e) => {
            let target = e.target;
            while (target && target !== document) {
                if (target.tagName === 'A') {
                    const href = target.getAttribute('href') || target.href;
                    if (href && !isInternalUrl(href) && (target.target === '_blank' || (typeof href === 'string' && href.startsWith('http')))) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                        console.warn('[Popunder Shield] Intercepted external link popunder event:', href);
                        return false;
                    }
                }
                target = target.parentElement;
            }
        };

        const eventTypes = ['click', 'touchstart', 'touchend', 'pointerdown'];
        eventTypes.forEach(type => window.addEventListener(type, handleGlobalEvent, true));

        return () => {
            window.open = nativeOpen;
            HTMLAnchorElement.prototype.click = nativeAnchorClick;
            eventTypes.forEach(type => window.removeEventListener(type, handleGlobalEvent, true));
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
