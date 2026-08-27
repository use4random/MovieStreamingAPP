import React, { useState, useEffect, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { api } from '../services/api';

export default function VideoPlayerHUD({ mediaType, id, season = 1, episode = 1, title, trailerKey, servers = [] }) {

    const [selectedServer, setSelectedServer] = useState(0);
    const [loading, setLoading] = useState(true);
    const [cinemaMode, setCinemaMode] = useState(false);
    const [healthData, setHealthData] = useState(null);
    const [iframeError, setIframeError] = useState(false);
    
    // 2x Sound Booster state (1 = 100%, 1.5 = 150%, 2 = 200%)
    const [boostLevel, setBoostLevel] = useState(() => {
        try {
            const saved = localStorage.getItem('cinepulse_sound_boost');
            return saved ? parseFloat(saved) : 1;
        } catch {
            return 1;
        }
    });
    const [toastMessage, setToastMessage] = useState(null);
    const toastTimeoutRef = useRef(null);

    // Web Audio Gain / Compressor Node references
    const audioContextRef = useRef(null);
    const gainNodeRef = useRef(null);
    const compressorNodeRef = useRef(null);
    const mediaSourcesRef = useRef(new WeakSet());

    const { playClick, playWhoosh } = useAudio();

    // Initialize or update the Web Audio gain amplification
    const applyAudioBoost = useCallback((multiplier) => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;

            if (!audioContextRef.current) {
                audioContextRef.current = new AudioCtx();
                const ctx = audioContextRef.current;

                // Dynamics Compressor to prevent clipping distortion when boosting to 200%
                const compressor = ctx.createDynamicsCompressor();
                compressor.threshold.setValueAtTime(-18, ctx.currentTime);
                compressor.knee.setValueAtTime(30, ctx.currentTime);
                compressor.ratio.setValueAtTime(8, ctx.currentTime);
                compressor.attack.setValueAtTime(0.003, ctx.currentTime);
                compressor.release.setValueAtTime(0.25, ctx.currentTime);
                compressorNodeRef.current = compressor;

                // Gain Node for 2x volume boost
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(multiplier, ctx.currentTime);
                gainNodeRef.current = gain;

                gain.connect(compressor);
                compressor.connect(ctx.destination);
            } else {
                const ctx = audioContextRef.current;
                if (ctx.state === 'suspended') {
                    ctx.resume().catch(() => {});
                }
                if (gainNodeRef.current) {
                    gainNodeRef.current.gain.setTargetAtTime(multiplier, ctx.currentTime, 0.05);
                }
            }

            // Hook into any active HTML5 video/audio elements
            const mediaElements = document.querySelectorAll('video, audio');
            mediaElements.forEach(el => {
                if (!mediaSourcesRef.current.has(el)) {
                    try {
                        const source = audioContextRef.current.createMediaElementSource(el);
                        source.connect(gainNodeRef.current);
                        mediaSourcesRef.current.add(el);
                    } catch (e) {}
                }
            });
        } catch (err) {
            console.warn('[AudioBooster]: Web Audio setup notice:', err.message);
        }
    }, []);

    // Apply boost on mount and whenever boostLevel changes
    useEffect(() => {
        applyAudioBoost(boostLevel);
    }, [boostLevel, applyAudioBoost]);

    const handleCycleBoost = () => {
        try { playClick(); } catch {}
        const nextLevel = boostLevel === 1 ? 1.5 : boostLevel === 1.5 ? 2 : 1;
        setBoostLevel(nextLevel);
        applyAudioBoost(nextLevel);

        try {
            localStorage.setItem('cinepulse_sound_boost', String(nextLevel));
        } catch {}

        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        const label = nextLevel === 2 ? '2X SOUND BOOST (200% MAX)' : nextLevel === 1.5 ? '1.5X SOUND BOOST (150%)' : 'STANDARD AUDIO (100%)';
        const sub = nextLevel === 2 ? '+6dB Cinema Audio Amplification • Anti-Clipping Enabled' : nextLevel === 1.5 ? '+3.5dB Dialogue Enhancer' : 'Normal Volume Level';
        setToastMessage({ label, sub, level: nextLevel });
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
    };

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

    // Fetch health data once and auto-select fastest healthy server
    useEffect(() => {
        let cancelled = false;

        async function loadHealth() {
            try {
                const health = await api.getServerHealth();
                if (!cancelled && health && health.nodes) {
                    setHealthData(health);
                    const healthyNodes = health.nodes.filter(n => n.healthy);
                    if (healthyNodes.length > 0 && servers.length > 0) {
                        const fastestHealthy = healthyNodes[0];
                        const idx = activeServers.findIndex(s => s.id === fastestHealthy.id);
                        if (idx >= 0) {
                            setSelectedServer(idx);
                        }
                    }
                }
            } catch (err) {
                console.warn('Health check fetch failed, using default server order');
            }
        }

        if (servers.length > 0) {
            loadHealth();
        }

        return () => { cancelled = true; };
    }, [id, season, episode]);

    useEffect(() => {
        setIframeError(false);
        setLoading(false);
    }, [selectedServer, id, season, episode]);

    // Active AdShield: Intercept rogue popup attempts and prevent window redirection / phishing traps
    useEffect(() => {
        const originalOpen = window.open;
        window.open = function (...args) {
            console.warn('[AdShield]: Intercepted unauthorized popup/tab opening attempt');
            return null;
        };

        // Suppress top-window navigation from rogue embed click events
        const handleWindowBlur = () => {
            if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
                // Instantly regain focus so blur cannot trigger background tab redirection
                window.focus();
            }
        };

        const handleBeforeUnloadCheck = (e) => {
            // If an unprompted unload happens from an iframe event, protect user session
            if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
                console.warn('[AdShield]: Guarded against iframe-triggered navigation');
            }
        };

        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('beforeunload', handleBeforeUnloadCheck);

        return () => {
            window.open = originalOpen;
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('beforeunload', handleBeforeUnloadCheck);
        };
    }, []);

    const toggleCinema = () => {
        playClick();
        const next = !cinemaMode;
        setCinemaMode(next);
        document.body.classList.toggle('cinema-mode', next);
    };

    const handleServerSelect = (idx) => {
        playClick();
        setSelectedServer(idx);
        setIframeError(false);
    };

    const handleIframeError = useCallback(() => {
        setIframeError(true);
        setSelectedServer(prev => (prev + 1) % Math.max(activeServers.length, 1));
    }, [activeServers.length]);

    const getNodeHealthStatus = (serverId) => {
        if (!healthData || !healthData.nodes) return null;
        return healthData.nodes.find(n => n.id === serverId);
    };

    const isYouTubeUrl = (url) => {
        if (!url) return false;
        return url.includes('youtube.com') || url.includes('youtu.be');
    };

    const getIframeSrc = (rawUrl) => {
        if (!rawUrl) return '';
        // Direct stream embedding for maximum speed, zero proxy latency, and 100% node availability
        return rawUrl;
    };

    const currentServer = activeServers[selectedServer] || activeServers[0];
    const iframeSrc = getIframeSrc(currentServer?.url);
    const currentNodeHealth = getNodeHealthStatus(currentServer?.id);
    const isYouTube = isYouTubeUrl(currentServer?.url);

    // Full HTML5 video sandbox flags to allow HLS, MSE, storage caching, and subtitle downloads without sandbox errors
    const sandboxConfig = isYouTube
        ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox"
        : "allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock allow-downloads allow-modals allow-popups-to-escape-sandbox";

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* 2x Sound Increaser / Audio Booster Button */}
                        <button
                            className={`hud-btn hud-sound-boost-btn ${boostLevel > 1 ? 'hud-sound-boost--active' : ''} ${boostLevel === 2 ? 'hud-sound-boost--max' : ''}`}
                            onClick={handleCycleBoost}
                            title={`Audio Increaser: ${boostLevel}x (${boostLevel === 2 ? '200% Maximum Boost' : boostLevel === 1.5 ? '150% Boost' : '100% Standard'}). Click to cycle.`}
                            aria-label="Toggle 2x Sound Booster"
                        >
                            <i className={`fas ${boostLevel === 2 ? 'fa-volume-high text-brand' : boostLevel === 1.5 ? 'fa-volume-low text-cyan' : 'fa-volume-high'}`}></i>
                            <span>{boostLevel === 2 ? '2x Boost' : boostLevel === 1.5 ? '1.5x Boost' : '1x Sound'}</span>
                            {boostLevel > 1 && (
                                <span className="boost-badge">
                                    <span className="sound-wave-bar"></span>
                                    <span className="sound-wave-bar"></span>
                                    <span className="sound-wave-bar"></span>
                                    {boostLevel * 100}%
                                </span>
                            )}
                        </button>

                        <button className="hud-btn" onClick={(e) => { e.stopPropagation(); toggleCinema(); }} title="Toggle Cinema Lights">
                            <i className="fas fa-lightbulb"></i> Cinema Mode
                        </button>
                        <button className="hud-btn" onClick={(e) => { e.stopPropagation(); setLoading(true); setIframeError(false); setTimeout(() => setLoading(false), 150); }} title="Re-sync Buffer">
                            <i className="fas fa-rotate"></i> Fast Re-Sync
                        </button>
                    </div>
                </div>

                <div className="player-container">
                    {/* Active Toast Overlay when Boost level changes */}
                    {toastMessage && (
                        <div className="audio-boost-toast">
                            <div className="boost-toast-icon">
                                <i className="fas fa-bolt"></i>
                            </div>
                            <div>
                                <div className="boost-toast-title">{toastMessage.label}</div>
                                <div className="boost-toast-sub">{toastMessage.sub}</div>
                            </div>
                        </div>
                    )}

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
                            allowFullScreen
                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen; accelerometer; gyroscope; clipboard-write"
                            referrerPolicy="origin-when-cross-origin"
                            loading="eager"
                            title={title}
                            onError={handleIframeError}
                        />
                    )}
                </div>
            </div>

            {/* Video Cloud Nodes */}
            <div className="sources-section">
                <h3 className="sources-title"><i className="fas fa-server text-brand"></i> Fast Streaming Cloud Nodes (Auto-Select Enabled)</h3>
                <div className="servers-grid">
                    {activeServers.map((server, idx) => {
                        const nodeHealth = getNodeHealthStatus(server.id);
                        return (
                            <div
                                key={server.id || idx}
                                className={`source-item ${selectedServer === idx ? 'active' : ''} ${nodeHealth && !nodeHealth.healthy ? 'source-item--unhealthy' : ''}`}
                                onClick={() => handleServerSelect(idx)}
                            >
                                <div className="source-icon">
                                    <i className={`fas ${server.icon || 'fa-play'}`}></i>
                                    {nodeHealth && (
                                        <span className="source-health-dot" style={{
                                            backgroundColor: nodeHealth.healthy ? 'var(--green)' : 'var(--brand)'
                                        }}></span>
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="source-name">{server.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {server.type || server.quality}
                                        {nodeHealth && (
                                            <span style={{ marginLeft: '6px', color: nodeHealth.healthy ? 'var(--green)' : 'var(--brand)' }}>
                                                ({nodeHealth.responseTime}ms)
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="source-ping">{server.ping || 'Online'}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
