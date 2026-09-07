import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import SearchModal from './components/SearchModal';
import AuthModal from './components/AuthModal';
import MobileBottomNav from './components/MobileBottomNav';
import { useCinePulseStore } from './store/useCinePulseStore';
import { useAuth } from './context/AuthContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const DetailPage = lazy(() => import('./pages/DetailPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const GenrePage = lazy(() => import('./pages/GenrePage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));

const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
};

function PageLoader() {
    return (
        <div className="pulse-loader-wrap">
            <div className="pulse-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-core"><i className="fas fa-film"></i></div>
            </div>
            <div className="loader-text">LOADING...</div>
        </div>
    );
}

export default function App() {
    const { searchOpen, openSearch, closeSearch } = useCinePulseStore();
    const { openAuthModal } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === '/signup' || location.pathname === '/register') {
            openAuthModal('register');
        } else if (location.pathname === '/login' || location.pathname === '/signin') {
            openAuthModal('login');
        }
    }, [location.pathname]);

    // Prevent unauthorized external redirects and popups
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

        const dummyWindow = {
            focus: () => {},
            blur: () => {},
            close: () => {},
            postMessage: () => {},
            location: { href: '' }
        };

        const nativeOpen = window.open;
        window.open = function (url, target, features) {
            try {
                if (url && isInternalUrl(url)) {
                    return nativeOpen.call(window, url, target, features);
                }
                console.warn('Blocked external popup:', url || 'empty_url');
                return dummyWindow;
            } catch {
                return dummyWindow;
            }
        };

        let nativeAnchorClick = null;
        if (typeof HTMLAnchorElement !== 'undefined' && HTMLAnchorElement.prototype) {
            nativeAnchorClick = HTMLAnchorElement.prototype.click;
            HTMLAnchorElement.prototype.click = function () {
                try {
                    const href = this.getAttribute('href') || this.href;
                    if (href && !isInternalUrl(href) && (this.target === '_blank' || (typeof href === 'string' && href.startsWith('http')))) {
                        console.warn('Blocked external link click:', href);
                        return;
                    }
                    return nativeAnchorClick.apply(this, arguments);
                } catch {
                    // Ignore error
                }
            };
        }

        const handleGlobalEvent = (e) => {
            let target = e.target;
            while (target && target !== document) {
                if (target.tagName === 'A') {
                    const href = target.getAttribute('href') || target.href;
                    if (href && !isInternalUrl(href) && (target.target === '_blank' || (typeof href === 'string' && href.startsWith('http')))) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                        console.warn('Intercepted external link event:', href);
                        return false;
                    }
                }
                target = target.parentElement;
            }
        };

        const eventTypes = ['click', 'touchstart', 'touchend', 'pointerdown'];
        eventTypes.forEach(type => window.addEventListener(type, handleGlobalEvent, true));

        const handleBeforeUnload = (e) => {
            if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
                console.warn('Blocked navigation from iframe');
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.open = nativeOpen;
            if (nativeAnchorClick && typeof HTMLAnchorElement !== 'undefined' && HTMLAnchorElement.prototype) {
                HTMLAnchorElement.prototype.click = nativeAnchorClick;
            }
            eventTypes.forEach(type => window.removeEventListener(type, handleGlobalEvent, true));
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);





    // Close search on route change
    useEffect(() => {
        closeSearch();
    }, [location.pathname]);

    return (
        <>
            <Navbar onOpenSearch={openSearch} />

            <SearchModal isOpen={searchOpen} onClose={closeSearch} />
            <AuthModal />


            <div className="site-container">
                <main className="main-content" id="mainContent">
                    <Suspense fallback={<PageLoader />}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <Routes location={location}>
                                    <Route path="/" element={<HomePage />} />
                                    <Route path="/index.html" element={<HomePage />} />
                                    <Route path="/signup" element={<HomePage />} />
                                    <Route path="/register" element={<HomePage />} />
                                    <Route path="/login" element={<HomePage />} />
                                    <Route path="/signin" element={<HomePage />} />
                                    <Route path="/detail/:type/:id" element={<DetailPage />} />
                                    <Route path="/search/:query" element={<SearchPage />} />
                                    <Route path="/genre/:genreId/:name" element={<GenrePage />} />
                                    <Route path="/collections" element={<CollectionsPage />} />
                                    <Route path="/watchlist" element={<WatchlistPage />} />
                                </Routes>
                            </motion.div>
                        </AnimatePresence>
                    </Suspense>
                </main>
                <Sidebar />
            </div>

            <Footer />

            <MobileBottomNav onOpenSearch={openSearch} />

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
