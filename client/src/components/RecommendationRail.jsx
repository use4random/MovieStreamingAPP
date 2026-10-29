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
                        Recommended For You
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
            <div className="section-header" style={{ marginBottom: '16px' }}>
                <div>
                    <h2 className="section-title" style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#fff' }}>
                        {title}
                    </h2>
                    {reason && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                            {reason}
                        </p>
                    )}
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
