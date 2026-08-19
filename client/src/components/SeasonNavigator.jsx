import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAudio } from '../context/AudioContext';

export default function SeasonNavigator({ showId, seasons = [], activeSeason, activeEpisode, onSelectEpisode }) {
    const [selectedSeason, setSelectedSeason] = useState(activeSeason || 1);
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const { playClick, playWhoosh } = useAudio();

    const validSeasons = seasons.filter(s => s.season_number > 0);

    useEffect(() => {
        if (!showId) return;
        setLoading(true);
        api.getSeasonDetails(showId, selectedSeason).then(data => {
            setLoading(false);
            if (data && data.episodes) {
                setEpisodes(data.episodes);
            }
        });
    }, [showId, selectedSeason]);

    const handleSeasonChange = (num) => {
        playClick();
        setSelectedSeason(num);
    };

    const handleEpisodeClick = (epNum) => {
        playWhoosh();
        onSelectEpisode(selectedSeason, epNum);
    };

    if (validSeasons.length === 0) return null;

    return (
        <div className="seasons-section">
            <h3 className="sources-title"><i className="fas fa-layer-group text-brand"></i> Seasons & Episode Navigator</h3>
            
            <div className="season-selector">
                {validSeasons.map(s => (
                    <button
                        key={s.id || s.season_number}
                        className={`season-btn ${selectedSeason === s.season_number ? 'active' : ''}`}
                        onClick={() => handleSeasonChange(s.season_number)}
                    >
                        Season {s.season_number} <span style={{ fontSize: '11px', opacity: 0.7 }}>({s.episode_count} eps)</span>
                    </button>
                ))}
            </div>

            <div className="episodes-list">
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        <i className="fas fa-spinner fa-spin fa-lg"></i> Loading Episodes...
                    </div>
                ) : episodes.length > 0 ? (
                    episodes.map(ep => (
                        <div
                            key={ep.id}
                            className={`episode-item ${selectedSeason === activeSeason && ep.episode_number === activeEpisode ? 'active' : ''}`}
                            onClick={() => handleEpisodeClick(ep.episode_number)}
                        >
                            <span className="ep-num">{ep.episode_number}</span>
                            <div className="ep-title" title={ep.name || `Episode ${ep.episode_number}`}>
                                Episode {ep.episode_number}{ep.name ? `: ${ep.name}` : ''}
                            </div>
                            <i className="fas fa-play" style={{ fontSize: '12px', color: 'var(--brand)' }}></i>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1/-1', color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
                        No episode details found for Season {selectedSeason}.
                    </div>
                )}
            </div>
        </div>
    );
}
