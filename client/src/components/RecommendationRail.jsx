import React from 'react';
import MovieCard from './MovieCard';

export default function RecommendationRail({ 
    title = 'Recommended For You', 
    reason, 
    items = [], 
    isLoading = false,
    defaultMediaType = 'movie'
}) {
    if (isLoading) {
        return (
            <section style={{ marginBottom: '38px' }}>
                <div className="section-header">
                    <h2 className="section-title">
                        <span className="material-symbols-outlined" style={{ color: 'var(--brand)', verticalAlign: 'middle', marginRight: '6px' }}>
                            auto_awesome
                        </span>
                        Analyzing Preferences...
                    </h2>
                </div>
                <div className="content-grid wide">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <div key={n} className="card-skeleton" style={{ height: '260px', borderRadius: '12px' }} />
                    ))}
                </div>
            </section>
        );
    }

    if (!items || items.length === 0) return null;

    return (
        <section style={{ marginBottom: '40px' }} className="fade-in">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 81, 104, 0.1)', border: '1px solid rgba(255, 81, 104, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', color: 'var(--brand)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>psychology</span>
                        HYBRID REC ALGORITHM v1.0
                    </div>
                    <h2 className="section-title" style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#fff' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--brand)', verticalAlign: 'middle', marginRight: '8px' }}>
                            recommend
                        </span>
                        {title}
                    </h2>
                    {reason && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                            {reason}
                        </p>
                    )}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--cyan)', background: 'rgba(0, 242, 254, 0.08)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                    <i className="fas fa-bolt" style={{ marginRight: '4px' }}></i> Realtime Neural Match
                </div>
            </div>

            <div className="content-grid wide">
                {items.map(item => (
                    <MovieCard 
                        key={`${item.media_type || defaultMediaType}_${item.id}`} 
                        item={{ ...item, media_type: item.media_type || defaultMediaType }} 
                    />
                ))}
            </div>
        </section>
    );
}
