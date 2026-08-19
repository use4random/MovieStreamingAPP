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
        const nativeOpen = window.open;
        window.open = function (url, target, features) {
            // Allow internal app navigation or trusted origins
            if (!url || typeof url !== 'string') return null;
            if (url.startsWith('/') || url.includes(window.location.hostname)) {
                return nativeOpen.call(window, url, target, features);
            }
            console.warn('[Popunder Shield] Blocked third-party ad popup:', url);
            return null;
        };

        return () => {
            window.open = nativeOpen;
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
