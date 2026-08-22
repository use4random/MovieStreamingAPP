import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MovieCard from '../../components/MovieCard';
import AgeGateModal from './AgeGateModal';

export default function AdultSection() {
    const [unlocked, setUnlocked] = useState(() => {
        return sessionStorage.getItem('cinepulse_adult_unlocked') === 'true';
    });
    const [page, setPage] = useState(1);
    const [wiping, setWiping] = useState(false);
    const [wipeMsg, setWipeMsg] = useState('');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['adult-feed', page],
        queryFn: async () => {
            const res = await fetch(`/api/adult/feed?page=${page}`);
            if (!res.ok) throw new Error('Failed to fetch 18+ catalog');
            return res.json();
        },
        enabled: unlocked
    });

    const handleConfirmAge = () => {
        sessionStorage.setItem('cinepulse_adult_unlocked', 'true');
        setUnlocked(true);
    };

    const handleWipeData = async () => {
        if (!window.confirm('⚠️ ARE YOU SURE? This will permanently wipe all 18+ catalog entries from the system database!')) {
            return;
        }

        setWiping(true);
        try {
            const res = await fetch('/api/adult/wipe', { method: 'POST' });
            const result = await res.json();
            setWipeMsg(result.message || '18+ Catalog Wiped');
            refetch();
        } catch (err) {
            setWipeMsg('Failed to wipe data: ' + err.message);
        } finally {
            setWiping(false);
        }
    };

    if (!unlocked) {
        return (
            <AgeGateModal
                isOpen={!unlocked}
                onConfirm={handleConfirmAge}
                onCancel={() => window.location.href = '/'}
            />
        );
    }

    return (
        <div className="fade-in" style={{ minHeight: '80vh', paddingBottom: '40px' }}>
            {/* 18+ Header Banner */}
            <div className="glass-panel" style={{
                padding: '28px',
                borderRadius: '20px',
                marginBottom: '32px',
                background: 'linear-gradient(135deg, rgba(255, 42, 109, 0.15) 0%, rgba(155, 0, 232, 0.1) 100%)',
                border: '1px solid rgba(255, 42, 109, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#ff2a6d',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '900',
                        fontFamily: 'var(--font-mono)',
                        marginBottom: '8px'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>explicit</span>
                        SEPARATE 18+ ZONE
                    </div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: '900', color: '#fff', margin: '0 0 6px 0' }}>
                        Mature Cinema & 18+ Streams
                    </h1>
                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                        Isolated catalog of NC-17, TV-MA, and adult titles. Kept completely separate from mainstream feeds.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleWipeData}
                        disabled={wiping}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            background: 'rgba(255, 42, 109, 0.2)',
                            color: '#ff2a6d',
                            border: '1px solid #ff2a6d',
                            fontSize: '13px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        title="Instantly wipe all 18+ database content"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete_forever</span>
                        {wiping ? 'Wiping Catalog...' : 'Wipe 18+ Data'}
                    </button>
                </div>
            </div>

            {wipeMsg && (
                <div className="glass-panel" style={{ padding: '12px 20px', borderRadius: '10px', color: '#ff2a6d', marginBottom: '20px', fontSize: '13px' }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i> {wipeMsg}
                </div>
            )}

            {/* Catalog Grid */}
            {isLoading ? (
                <div className="content-grid wide">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                        <div key={n} className="card-skeleton" style={{ height: '260px', borderRadius: '12px' }} />
                    ))}
                </div>
            ) : data?.results?.length > 0 ? (
                <div className="content-grid wide">
                    {data.results.map(item => (
                        <MovieCard
                            key={item.id}
                            item={{
                                ...item,
                                media_type: item.media_type || 'movie'
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-watchlist" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'rgba(255, 42, 109, 0.5)', marginBottom: '16px' }}>explicit</span>
                    <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>18+ Catalog Empty or Wiped</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        No items found in the isolated 18+ database. Trigger a sync from admin or wipe tools.
                    </p>
                </div>
            )}
        </div>
    );
}
