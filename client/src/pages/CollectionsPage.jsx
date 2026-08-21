import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { api, getBackdrop } from '../services/api';
import { useAudio } from '../context/AudioContext';

const GENRE_CARDS = [
    { id: 28, name: 'Action', icon: 'fa-fire-flame-curved', bg: 'https://image.tmdb.org/t/p/w780/by8z9Fe8y7p4jo2YlW2SZDnptyT.jpg', desc: 'High octane thrillers & combat' },
    { id: 878, name: 'Sci-Fi', icon: 'fa-atom', bg: 'https://image.tmdb.org/t/p/w780/577eXC8wFQT0eUrJcgznSiFPRmk.jpg', desc: 'Cosmic & futuristic worlds' },
    { id: 27, name: 'Horror', icon: 'fa-ghost', bg: 'https://image.tmdb.org/t/p/w780/2meX1nMdScFOoV4370rqHWKmXhY.jpg', desc: 'Dark supernatural & chills' },
    { id: 16, name: 'Animation & Kids', icon: 'fa-wand-magic-sparkles', bg: 'https://image.tmdb.org/t/p/w780/q3jHCb4dMfYF6ojikKuHd6LscxC.jpg', desc: 'Family & animated adventures' },
    { id: 0, name: 'Anime Mega-Vault', icon: 'fa-dragon', bg: 'https://image.tmdb.org/t/p/w780/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg', desc: 'Top Japanese anime & series', endpoint: 'anime_hub' },
];

export default function CollectionsPage() {
    const [collections, setCollections] = useState([]);
    const [activeCollection, setActiveCollection] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [feedItems, setFeedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedLoading, setFeedLoading] = useState(false);
    const [quickQuery, setQuickQuery] = useState('');
    const navigate = useNavigate();
    const { playClick, playWhoosh } = useAudio();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        api.getCollections().then(data => {
            setLoading(false);
            if (data) setCollections(data);
        });
    }, []);

    const handleQuickSearch = (e) => {
        e.preventDefault();
        if (quickQuery.trim()) {
            playClick();
            navigate(`/search/${encodeURIComponent(quickQuery.trim())}`);
        }
    };

    const handleSelectCollection = async (col) => {
        playWhoosh();
        setActiveCollection(col.id);
        setFeedLoading(true);

        const data = await api.getPlatformFeed(col.endpoint, 1);
        setFeedLoading(false);

        if (data && data.results) {
            setFeedItems(data.results.slice(0, 18));
        }
    };

    const filteredCollections = collections.filter(c => {
        if (activeTab === 'all') return true;
        if (activeTab === 'universes') return c.category === 'universes' || c.tag === 'UNIVERSE' || c.tag === 'FRANCHISE';
        if (activeTab === 'platforms') return c.category === 'platforms' || c.tag.includes('NETWORK') || c.tag.includes('STREAM');
        if (activeTab === 'world') return c.category === 'world' || c.tag.includes('ANIME') || c.tag.includes('CINEMA') || c.tag.includes('PAN-INDIA');
        return true;
    });

    if (loading) {
        return (
            <div className="cyber-loader-wrap">
                <div className="cyber-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-core"><i className="fas fa-compass text-brand" style={{ fontSize: '24px' }}></i></div>
                </div>
                <div className="loader-text">DISCOVERING MULTI-UNIVERSE HUBS...</div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ paddingBottom: '40px' }}>
            {/* Quick Finder Search Bar */}
            <div className="glass-panel" style={{ padding: '24px 28px', borderRadius: '16px', marginBottom: '32px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-search text-brand" style={{ fontSize: '18px' }}></i>
                    Quick Finder
                </h2>
                <form onSubmit={handleQuickSearch} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px' }}></i>
                        <input
                            type="text"
                            placeholder="Search by title, universe (Marvel, DC, Star Wars), actor, or director..."
                            value={quickQuery}
                            onChange={(e) => setQuickQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px 14px 48px',
                                background: 'rgba(12, 14, 18, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '15px',
                                fontFamily: 'var(--font-body)',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        className="glow-button"
                        style={{
                            background: 'var(--brand)',
                            color: '#fff',
                            padding: '0 24px',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontFamily: 'var(--font-heading)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <span>Search</span>
                        <i className="fas fa-arrow-right" style={{ fontSize: '13px' }}></i>
                    </button>
                </form>
            </div>

            {/* Browse by Genre Bento Grid */}
            <div style={{ marginBottom: '36px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '700' }}>
                        Browse by Genre
                    </h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {GENRE_CARDS.map(g => (
                        <Link
                            key={g.name}
                            to={g.endpoint ? `/genre/0/${encodeURIComponent(g.name)}?endpoint=${g.endpoint}` : `/genre/${g.id}/${encodeURIComponent(g.name)}`}
                            className="glass-card collection-card"
                            style={{
                                position: 'relative',
                                borderRadius: '14px',
                                overflow: 'hidden',
                                minHeight: '120px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'var(--transition-smooth)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                            onClick={playClick}
                        >
                            <img
                                src={g.bg}
                                alt={g.name}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    opacity: 0.35,
                                    filter: 'brightness(0.7) contrast(1.1)'
                                }}
                            />
                            <div style={{ position: 'relative', zIndex: 2, padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <i className={`fas ${g.icon}`} style={{ fontSize: '24px', color: 'var(--brand)' }}></i>
                                    <i className="fas fa-arrow-right" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}></i>
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '2px', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                                        {g.name}
                                    </h3>
                                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{g.desc}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="page-header-cyber">
                <h1 className="page-title">
                    <i className="fas fa-cubes text-brand" style={{ marginRight: '8px', fontSize: '22px' }}></i>
                    Cinematic Universe & Franchise Collections
                </h1>
                <span className="section-count">{filteredCollections.length} curated hubs</span>
            </div>

            {/* Category Filter Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button 
                    className={`hub-pill ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => { playClick(); setActiveTab('all'); }}
                >
                    All Collections ({collections.length})
                </button>
                <button 
                    className={`hub-pill ${activeTab === 'universes' ? 'active' : ''}`}
                    style={activeTab === 'universes' ? { background: 'linear-gradient(135deg, var(--brand) 0%, #7d090d 100%)' } : {}}
                    onClick={() => { playClick(); setActiveTab('universes'); }}
                >
                    Cinematic Universes ({collections.filter(c => c.category === 'universes').length})
                </button>
                <button 
                    className={`hub-pill ${activeTab === 'platforms' ? 'active' : ''}`}
                    onClick={() => { playClick(); setActiveTab('platforms'); }}
                >
                    Streaming Networks ({collections.filter(c => c.category === 'platforms').length})
                </button>
                <button 
                    className={`hub-pill ${activeTab === 'world' ? 'active' : ''}`}
                    onClick={() => { playClick(); setActiveTab('world'); }}
                >
                    World Cinema & Anime ({collections.filter(c => c.category === 'world').length})
                </button>
            </div>

            <div className="collections-grid">
                {filteredCollections.map(col => (
                    <div
                        key={col.id}
                        className={`collection-card ${activeCollection === col.id ? 'active' : ''}`}
                        onClick={() => handleSelectCollection(col)}
                    >
                        <div className="collection-backdrop">
                            <img
                                src={col.backdrop || getBackdrop(null)}
                                alt={col.name}
                                loading="lazy"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <div className="collection-overlay">
                                <span className="collection-tag">{col.tag}</span>
                                <h3 className="collection-name">{col.name}</h3>
                                <p className="collection-desc">{col.desc}</p>
                                <Link
                                    to={`/genre/0/${encodeURIComponent(col.name)}?endpoint=${col.endpoint}`}
                                    className="cyber-btn-sm"
                                    onClick={(e) => { e.stopPropagation(); playClick(); }}
                                >
                                    <i className="fas fa-arrow-right"></i> Explore Full Feed
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Collection Feed */}
            {activeCollection && (
                <section style={{ marginTop: '30px' }}>
                    <div className="section-header">
                        <h2 className="section-title">
                            {collections.find(c => c.id === activeCollection)?.name || 'Collection'} — Preview
                        </h2>
                    </div>
                    {feedLoading ? (
                        <div className="cyber-loader-wrap" style={{ padding: '40px 0' }}>
                            <div className="cyber-spinner">
                                <div className="spinner-ring"></div>
                                <div className="spinner-core"><i className="fas fa-satellite-dish"></i></div>
                            </div>
                            <div className="loader-text">FETCHING COLLECTION FEED...</div>
                        </div>
                    ) : (
                        <div className="content-grid wide">
                            {feedItems.map(item => (
                                <MovieCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
