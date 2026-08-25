import React, { useState, useEffect, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { api } from '../services/api';

export default function VideoPlayerHUD({ mediaType, id, season = 1, episode = 1, title, trailerKey, servers = [] }) {

    const [selectedServer, setSelectedServer] = useState(0);
    const [loading, setLoading] = useState(true);
    const [cinemaMode, setCinemaMode] = useState(false);
    const [healthData, setHealthData] = useState(null);
    const [iframeError, setIframeError] = useState(false);
    const [disabledNodeIds, setDisabledNodeIds] = useState(new Set());
    const [autoNotice, setAutoNotice] = useState(null);
    const { playClick } = useAudio();

    // Combine cloud embed servers with official trailer if available
    const activeServers = [...servers];
    if (trailerKey) {
        activeServers.push({
            id: 'official_trailer',
            name: 'Official 4K Trailer',
            icon: 'fa-youtube',
            ping: '4K HDR',
            quality: 'YouTube 4K',
            type: 'Official Trailer',
            url: `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`
        });
    }

    const getNodeHealthStatus = useCallback((serverId) => {
        if (!healthData || !healthData.nodes) return null;
        return healthData.nodes.find(n => n.id === serverId);
    }, [healthData]);

    // Find next available non-disabled, healthy node
    const getNextWorkingNodeIndex = useCallback((currentIdx, disabledSet, health) => {
        if (!activeServers || activeServers.length === 0) return 0;
        for (let i = 1; i <= activeServers.length; i++) {
            const nextIdx = (currentIdx + i) % activeServers.length;
            const server = activeServers[nextIdx];
            const nodeHealth = health?.nodes?.find(n => n.id === server?.id);
            const isUnhealthy = nodeHealth && nodeHealth.healthy === false;
            const isDisabled = disabledSet.has(server?.id);
            if (!isUnhealthy && !isDisabled) {
                return nextIdx;
            }
        }
        return -1; // All nodes disabled
    }, [activeServers]);

    // Mark current node as disabled and auto-switch to next available node
    const markNodeAsDisabledAndSwitch = useCallback((failedIdx, reason = 'failed to load') => {
        const failedServer = activeServers[failedIdx];
        if (!failedServer) return;

        setDisabledNodeIds(prev => {
            const nextSet = new Set(prev);
            nextSet.add(failedServer.id);

            const nextIdx = getNextWorkingNodeIndex(failedIdx, nextSet, healthData);

            if (nextIdx !== -1 && nextIdx !== failedIdx) {
                const nextServer = activeServers[nextIdx];
                setAutoNotice(`⚠️ Node ${failedServer.name} ${reason}. Auto-switching to ${nextServer.name}...`);
                setTimeout(() => setAutoNotice(null), 5000);
                setSelectedServer(nextIdx);
            } else {
                setAutoNotice(`⚠️ All streaming nodes currently unresponsive. Try Fast Re-Sync.`);
            }

            return nextSet;
        });
    }, [activeServers, healthData, getNextWorkingNodeIndex]);

    // Fetch health data once and auto-select fastest healthy server
    useEffect(() => {
        let cancelled = false;

        async function loadHealth() {
            try {
                const health = await api.getServerHealth();
                if (!cancelled && health && health.nodes) {
                    setHealthData(health);
                    
                    // Mark server-checked unhealthy nodes as disabled
                    const unhealthyIds = health.nodes.filter(n => n.healthy === false).map(n => n.id);
                    if (unhealthyIds.length > 0) {
                        setDisabledNodeIds(prev => new Set([...prev, ...unhealthyIds]));
                    }

                    const healthyNodes = health.nodes.filter(n => n.healthy);
                    if (healthyNodes.length > 0 && activeServers.length > 0) {
                        const fastestHealthy = healthyNodes[0];
                        const idx = activeServers.findIndex(s => s.id === fastestHealthy.id);
                        if (idx >= 0 && idx !== selectedServer) {
                            setSelectedServer(idx);
                        }
                    }
                }
            } catch (err) {
                console.warn('Health check fetch failed, using default server order');
            }
        }

        if (activeServers.length > 0) {
            loadHealth();
        }

        return () => { cancelled = true; };
    }, [id, season, episode]);

    // Watchdog timer: automatically switch if current server isn't responding within 4500ms
    useEffect(() => {
        setIframeError(false);
        setLoading(true);

        const currentServer = activeServers[selectedServer];
        if (!currentServer) return;

        const watchdog = setTimeout(() => {
            console.warn(`[StreamHUD]: Node ${currentServer.name} unresponsive (>4.5s). Auto-switching to next working node.`);
            markNodeAsDisabledAndSwitch(selectedServer, "isn't responding instantly");
        }, 4500);

        return () => {
            clearTimeout(watchdog);
        };
    }, [selectedServer, id, season, episode, markNodeAsDisabledAndSwitch]);

    // Active AdShield: Intercept rogue popup attempts and prevent window redirection
    useEffect(() => {
        const originalOpen = window.open;
        window.open = function (...args) {
            console.warn('[AdShield]: Intercepted unauthorized popup/tab opening attempt');
            return null;
        };

        const handleWindowBlur = () => {
            if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
                window.focus();
            }
        };

        window.addEventListener('blur', handleWindowBlur);

        return () => {
            window.open = originalOpen;
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, []);

    const toggleCinema = () => {
        playClick();
        const next = !cinemaMode;
        setCinemaMode(next);
        document.body.classList.toggle('cinema-mode', next);
    };

    const handleServerSelect = (idx) => {
        const server = activeServers[idx];
        const nodeHealth = getNodeHealthStatus(server?.id);
        const isNodeDisabled = disabledNodeIds.has(server?.id) || (nodeHealth && !nodeHealth.healthy);

        if (isNodeDisabled) {
            return; // Unclickable!
        }

        playClick();
        setSelectedServer(idx);
        setIframeError(false);
    };

    const handleFastResync = () => {
        playClick();
        setDisabledNodeIds(new Set());
        setAutoNotice("Resetting node statuses. Re-syncing buffer...");
        setTimeout(() => setAutoNotice(null), 3000);
        setLoading(true);
        setIframeError(false);
        setSelectedServer(0);
    };

    const isYouTubeUrl = (url) => {
        if (!url) return false;
        return url.includes('youtube.com') || url.includes('youtu.be');
    };

    const getIframeSrc = (rawUrl) => {
        if (!rawUrl) return '';
        return rawUrl;
    };

    const currentServer = activeServers[selectedServer] || activeServers[0];
    const iframeSrc = getIframeSrc(currentServer?.url);
    const currentNodeHealth = getNodeHealthStatus(currentServer?.id);
    const isYouTube = isYouTubeUrl(currentServer?.url);

    const sandboxConfig = isYouTube
        ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox"
        : "allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock";

    return (
        <>
            {cinemaMode && <div className="cinema-backdrop" onClick={toggleCinema}></div>}

            <div className="player-section" id="playerSection">
                <div className="player-hud-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={`hud-status-dot ${iframeError ? 'hud-status-dot--error' : ''}`}></span>
                        <span className="hud-stream-title"><i className="fas fa-satellite-dish text-brand"></i> {title}</span>
                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', color: 'var(--cyan)' }}>
                            {mediaType === 'tv' ? `S${season} E${episode}` : '4K ULTRA'}
                        </span>
                        {currentNodeHealth && (
                            <span style={{ fontSize: '10px', background: currentNodeHealth.healthy ? 'rgba(0,255,136,0.1)' : 'rgba(229,9,20,0.1)', padding: '2px 8px', borderRadius: '4px', color: currentNodeHealth.healthy ? 'var(--green)' : 'var(--brand)' }}>
                                {currentNodeHealth.healthy ? '● ONLINE' : '○ UNSTABLE'} {currentNodeHealth.responseTime}ms
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button className="hud-btn" onClick={(e) => { e.stopPropagation(); toggleCinema(); }} title="Toggle Cinema Lights">
                            <i className="fas fa-lightbulb"></i> Cinema Mode
                        </button>
                        <button className="hud-btn" onClick={(e) => { e.stopPropagation(); handleFastResync(); }} title="Re-sync Buffer & Reset Nodes">
                            <i className="fas fa-rotate"></i> Fast Re-Sync
                        </button>
                    </div>
                </div>

                {autoNotice && (
                    <div style={{
                        background: 'rgba(229, 9, 20, 0.15)',
                        border: '1px solid rgba(229, 9, 20, 0.4)',
                        color: '#ffffff',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        marginBottom: '14px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <i className="fas fa-satellite-dish" style={{ color: '#E50914' }}></i>
                        <span>{autoNotice}</span>
                    </div>
                )}

                <div className="player-container">
                    {loading || iframeError ? (
                        <div className="player-loading">
                            <div className="player-loading-spinner">
                                <i className={`fas ${iframeError ? 'fa-triangle-exclamation' : 'fa-spinner'} ${iframeError ? '' : 'fa-spin'} fa-2x`}></i>
                                <p style={{ marginTop: '10px', letterSpacing: '1px', fontFamily: "'Space Grotesk', monospace" }}>
                                    {iframeError ? 'SWITCHING TO BACKUP NODE...' : `CONNECTING TO ${currentServer?.name?.toUpperCase() || 'STREAM NODE'}...`}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <iframe
                            key={`${currentServer?.id}-${iframeSrc}`}
                            src={iframeSrc}
                            sandbox={sandboxConfig}
                            allowFullScreen
                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen; accelerometer; gyroscope"
                            referrerPolicy="no-referrer"
                            loading="eager"
                            title={title}
                            onLoad={() => setLoading(false)}
                            onError={() => markNodeAsDisabledAndSwitch(selectedServer, "failed to load")}
                        />
                    )}
                </div>
            </div>

            {/* Video Cloud Nodes */}
            <div className="sources-section">
                <h3 className="sources-title"><i className="fas fa-server text-brand"></i> Fast Streaming Cloud Nodes (Auto-Failover Active)</h3>
                <div className="servers-grid">
                    {activeServers.map((server, idx) => {
                        const nodeHealth = getNodeHealthStatus(server.id);
                        const isNodeDisabled = disabledNodeIds.has(server.id) || (nodeHealth && !nodeHealth.healthy);
                        const isUnhealthy = nodeHealth && !nodeHealth.healthy;

                        return (
                            <div
                                key={server.id || idx}
                                className={`source-item ${selectedServer === idx ? 'active' : ''} ${isNodeDisabled ? 'source-item--disabled' : isUnhealthy ? 'source-item--unhealthy' : ''}`}
                                onClick={() => handleServerSelect(idx)}
                                style={isNodeDisabled ? { pointerEvents: 'none', cursor: 'not-allowed' } : {}}
                                title={isNodeDisabled ? `${server.name} is unavailable` : `Switch to ${server.name}`}
                            >
                                <div className="source-icon">
                                    <i className={`fas ${server.icon || 'fa-play'}`}></i>
                                    {nodeHealth && (
                                        <span className="source-health-dot" style={{
                                            backgroundColor: isNodeDisabled ? 'var(--brand)' : nodeHealth.healthy ? 'var(--green)' : 'var(--brand)'
                                        }}></span>
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="source-name" style={{ textDecoration: isNodeDisabled ? 'line-through' : 'none' }}>
                                        {server.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {server.type || server.quality}
                                        {nodeHealth && (
                                            <span style={{ marginLeft: '6px', color: isNodeDisabled ? 'var(--brand)' : nodeHealth.healthy ? 'var(--green)' : 'var(--brand)' }}>
                                                ({isNodeDisabled ? 'OFFLINE' : `${nodeHealth.responseTime}ms`})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="source-ping" style={{
                                    backgroundColor: isNodeDisabled ? 'rgba(229, 9, 20, 0.15)' : undefined,
                                    color: isNodeDisabled ? 'var(--brand)' : undefined
                                }}>
                                    {isNodeDisabled ? 'UNAVAILABLE' : server.ping || 'Online'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
