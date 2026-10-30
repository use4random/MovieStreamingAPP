import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/thanos.css';

/**
 * Synthesizes cinematic Marvel Thanos Snap sound effects via Web Audio API.
 * 100% reliable, zero asset dependencies, zero network requests.
 */
function createThanosAudio() {
    let ctx = null;

    const getCtx = () => {
        if (!ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) ctx = new AudioCtx();
        }
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        return ctx;
    };

    const playSnapSound = () => {
        const audioCtx = getCtx();
        if (!audioCtx) return;
        const t = audioCtx.currentTime;

        try {
            // 1. High-frequency acoustic finger snap click (noise burst)
            const bufferSize = Math.floor(audioCtx.sampleRate * 0.05);
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.008));
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;

            const snapFilter = audioCtx.createBiquadFilter();
            snapFilter.type = 'bandpass';
            snapFilter.frequency.setValueAtTime(3200, t);
            snapFilter.Q.setValueAtTime(3.8, t);

            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.8, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

            noise.connect(snapFilter);
            snapFilter.connect(noiseGain);
            noiseGain.connect(audioCtx.destination);
            noise.start(t);

            // 2. Body pop (finger meat resonance)
            const popOsc = audioCtx.createOscillator();
            const popGain = audioCtx.createGain();
            popOsc.type = 'triangle';
            popOsc.frequency.setValueAtTime(380, t);
            popOsc.frequency.exponentialRampToValueAtTime(90, t + 0.05);
            popGain.gain.setValueAtTime(0.6, t);
            popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            popOsc.connect(popGain);
            popGain.connect(audioCtx.destination);
            popOsc.start(t);
            popOsc.stop(t + 0.06);

            // 3. Cosmic Cinematic Sub-Rumble (earth-shaking decimation)
            const subOsc = audioCtx.createOscillator();
            const subGain = audioCtx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(75, t + 0.02);
            subOsc.frequency.exponentialRampToValueAtTime(24, t + 1.4);
            subGain.gain.setValueAtTime(0.45, t + 0.02);
            subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
            subOsc.connect(subGain);
            subGain.connect(audioCtx.destination);
            subOsc.start(t + 0.02);
            subOsc.stop(t + 1.45);
        } catch (e) {
            console.warn('[ThanosAudio] Snap audio notice:', e.message);
        }
    };

    const playTimeReverseSound = () => {
        const audioCtx = getCtx();
        if (!audioCtx) return;
        const t = audioCtx.currentTime;

        try {
            // Harmonic mystic chime chord (Doctor Strange time stone rewind)
            const freqs = [329.63, 440.0, 554.37, 659.25, 880.0];
            freqs.forEach((f, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f * 0.7, t);
                osc.frequency.exponentialRampToValueAtTime(f * 1.35, t + 0.8 + idx * 0.08);

                gain.gain.setValueAtTime(0.001, t);
                gain.gain.exponentialRampToValueAtTime(0.12, t + 0.4);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(t);
                osc.stop(t + 1.35);
            });
        } catch (e) {
            console.warn('[ThanosAudio] Time stone audio notice:', e.message);
        }
    };

    return { playSnapSound, playTimeReverseSound };
}

const thanosAudio = createThanosAudio();

export default function ThanosSnap() {
    const [isSnapped, setIsSnapped] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [flash, setFlash] = useState(false);
    const [timeRing, setTimeRing] = useState(false);
    const [toast, setToast] = useState(null);

    const canvasRef = useRef(null);
    const snappedElementsRef = useRef([]);
    const particlesRef = useRef([]);
    const animFrameRef = useRef(null);
    const toastTimerRef = useRef(null);
    const location = useLocation();

    const showToast = (message, type = 'snap', quote = '') => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ message, type, quote });
        toastTimerRef.current = setTimeout(() => setToast(null), 3500);
    };

    // Restore elements if user navigates to another route while snapped
    const restoreAllElements = useCallback(() => {
        if (snappedElementsRef.current.length > 0) {
            snappedElementsRef.current.forEach(el => {
                if (el && el.classList) {
                    el.classList.remove('thanos-dissolving');
                    el.classList.remove('thanos-restoring');
                }
            });
            snappedElementsRef.current = [];
        }
        setIsSnapped(false);
        particlesRef.current = [];
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, []);

    useEffect(() => {
        restoreAllElements();
    }, [location.pathname, restoreAllElements]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            restoreAllElements();
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, [restoreAllElements]);

    // Particle render loop
    const runParticleLoop = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas to full viewport
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const particles = particlesRef.current;
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];

                p.x += p.vx;
                p.y += p.vy;
                p.vy -= 0.015; // upward thermal/dust drift
                p.alpha -= p.decay;
                p.rotation += p.vRot;

                if (p.alpha <= 0 || p.x > canvas.width + 50 || p.y < -50) {
                    particles.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;

                if (p.isEmber) {
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = '#ffab40';
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Ash flake
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * (p.aspect || 1));
                }
                ctx.restore();
            }

            if (particles.length > 0) {
                animFrameRef.current = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };

        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(render);
    }, []);

    // ── TRIGGER THANOS SNAP (DECIMATE 50%) ─────────────────────────────────
    const handleSnap = () => {
        if (isAnimating) return;
        setIsAnimating(true);

        // 1. Play snap sound effect
        thanosAudio.playSnapSound();

        // 2. Cosmic Screen Flash
        setFlash(true);
        setTimeout(() => setFlash(false), 850);

        // 3. Find visible content candidates
        const targetSelectors = [
            '.movie-card',
            '.hero-carousel-slide',
            '.glass-card',
            '.glass-panel',
            '.network-card',
            '.watchlist-card',
            '.sidebar-widget',
            '.bento-card'
        ];

        const allCandidates = Array.from(document.querySelectorAll(targetSelectors.join(','))).filter(el => {
            // Guard header, player HUD, modals, or the snap button itself
            if (el.closest('.site-header') || el.closest('#playerSection') || el.closest('.auth-modal') || el.closest('.thanos-snap-btn')) {
                return false;
            }
            const r = el.getBoundingClientRect();
            return r.width > 30 && r.height > 30 && r.bottom > 0 && r.top < window.innerHeight;
        });

        // Fallback if structured cards aren't matched
        let pool = allCandidates;
        if (pool.length < 4) {
            pool = Array.from(document.querySelectorAll('.main-content > *, .content-grid > *')).filter(el => {
                const r = el.getBoundingClientRect();
                return r.width > 40 && r.height > 40 && r.bottom > 0 && r.top < window.innerHeight;
            });
        }

        // Shuffle & select exactly 50%
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const victims = shuffled.slice(0, Math.ceil(pool.length / 2));
        snappedElementsRef.current = victims;

        // 4. Generate particles from each victim element
        const ashColors = ['#424242', '#616161', '#757575', '#9e9e9e', '#bcaaa4', '#37474f', '#212121'];
        const emberColors = ['#ff7043', '#ffab40', '#ffd54f'];

        victims.forEach((el, elIdx) => {
            const rect = el.getBoundingClientRect();
            const count = Math.min(100, Math.max(30, Math.floor((rect.width * rect.height) / 1400)));

            for (let i = 0; i < count; i++) {
                const isEmber = Math.random() < 0.2;
                particlesRef.current.push({
                    x: rect.left + Math.random() * rect.width,
                    y: rect.top + Math.random() * rect.height,
                    vx: (Math.random() * 2.8 + 1.2) * (Math.random() > 0.08 ? 1 : -0.4),
                    vy: (Math.random() - 0.5) * 1.8 - 0.5,
                    size: isEmber ? Math.random() * 2.5 + 1 : Math.random() * 3.5 + 1.5,
                    aspect: Math.random() * 0.8 + 0.6,
                    alpha: Math.random() * 0.85 + 0.15,
                    decay: Math.random() * 0.007 + 0.0035,
                    color: isEmber ? emberColors[Math.floor(Math.random() * emberColors.length)] : ashColors[Math.floor(Math.random() * ashColors.length)],
                    rotation: Math.random() * Math.PI * 2,
                    vRot: (Math.random() - 0.5) * 0.08,
                    isEmber
                });
            }

            // Stagger element dissolution
            const delay = (elIdx * 80) % 600;
            setTimeout(() => {
                el.classList.add('thanos-dissolving');
            }, delay);
        });

        // Start particle canvas simulation
        runParticleLoop();

        setIsSnapped(true);
        showToast('“I am inevitable.”', 'snap', '50% of the universe turned to dust. Click the Time Stone to restore.');

        setTimeout(() => {
            setIsAnimating(false);
        }, 1200);
    };

    // ── TRIGGER TIME STONE REVERSE (RESTORE UNIVERSE) ──────────────────────
    const handleRestore = () => {
        if (isAnimating) return;
        setIsAnimating(true);

        // 1. Play Time Stone mystical reverse sound
        thanosAudio.playTimeReverseSound();

        // 2. Expanding emerald green Time Stone ring
        setTimeRing(true);
        setTimeout(() => setTimeRing(false), 1250);

        // 3. Reconstitute dissolved elements
        const victims = snappedElementsRef.current;
        victims.forEach((el, idx) => {
            if (el && el.classList) {
                const delay = (idx * 60) % 500;
                setTimeout(() => {
                    el.classList.remove('thanos-dissolving');
                    el.classList.add('thanos-restoring');
                }, delay);
            }
        });

        // 4. Reverse particle green convergence effect
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const reverseParticles = [];
            victims.forEach(el => {
                const rect = el.getBoundingClientRect();
                for (let i = 0; i < 25; i++) {
                    reverseParticles.push({
                        targetX: rect.left + Math.random() * rect.width,
                        targetY: rect.top + Math.random() * rect.height,
                        x: rect.left + rect.width + (Math.random() * 200 + 50),
                        y: rect.top + (Math.random() - 0.5) * 150,
                        alpha: 1,
                        color: Math.random() > 0.4 ? '#00ff88' : '#7df4ff',
                        size: Math.random() * 3 + 1.5
                    });
                }
            });

            const renderReverse = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                let alive = false;
                for (let i = 0; i < reverseParticles.length; i++) {
                    const p = reverseParticles[i];
                    p.x += (p.targetX - p.x) * 0.12;
                    p.y += (p.targetY - p.y) * 0.12;
                    p.alpha -= 0.02;

                    if (p.alpha > 0) {
                        alive = true;
                        ctx.save();
                        ctx.globalAlpha = p.alpha;
                        ctx.fillStyle = p.color;
                        ctx.shadowBlur = 8;
                        ctx.shadowColor = '#00ff88';
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                }
                if (alive) {
                    requestAnimationFrame(renderReverse);
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            };
            requestAnimationFrame(renderReverse);
        }

        // Clean up restoring classes after animation completes
        setTimeout(() => {
            victims.forEach(el => {
                if (el && el.classList) {
                    el.classList.remove('thanos-restoring');
                }
            });
            snappedElementsRef.current = [];
            setIsSnapped(false);
            setIsAnimating(false);
        }, 1800);

        showToast('“I am Iron Man.”', 'restore', 'The universe has been restored.');
    };

    return (
        <>
            {/* Thanos Snap / Time Stone Action Button */}
            <button
                type="button"
                className={`thanos-snap-btn ${isSnapped ? 'is-snapped' : ''}`}
                onClick={isSnapped ? handleRestore : handleSnap}
                title={isSnapped ? 'Time Stone: Reverse Snap (Restore Universe)' : 'Thanos Snap (Turn 50% of Content into Dust)'}
                aria-label={isSnapped ? 'Time Stone Reverse' : 'Thanos Snap'}
                disabled={isAnimating}
            >
                {isSnapped ? (
                    /* Glowing Emerald Time Stone (Eye of Agamotto) */
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke="#00ff88" strokeWidth="1.8" strokeDasharray="3 2" />
                        <circle cx="12" cy="12" r="5" stroke="#7df4ff" strokeWidth="1.4" />
                        <polygon points="12,7 16,12 12,17 8,12" fill="#00ff88" filter="drop-shadow(0 0 4px #00ff88)" />
                        <circle cx="12" cy="12" r="2.2" fill="#ffffff" />
                    </svg>
                ) : (
                    /* Golden Infinity Gauntlet with 6 Glowing Infinity Stones */
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Metallic Golden Gauntlet Fist Base */}
                        <path
                            d="M6 13C6 11 8 8 11 8V5.5C11 4.7 11.7 4 12.5 4C13.3 4 14 4.7 14 5.5V8.5C14 8.5 15.2 8.5 16 9C16.8 9.5 17.5 10.5 17.5 12V14.5C17.5 17 15.5 19 13 19H10C7.8 19 6 17.2 6 15V13Z"
                            fill="url(#gauntletGold)"
                            stroke="#ffe066"
                            strokeWidth="1.1"
                        />
                        {/* Gauntlet Arm Cuff */}
                        <path d="M7 19H16V21C16 21.6 15.6 22 15 22H8C7.4 22 7 21.6 7 21V19Z" fill="#b8860b" />

                        {/* Infinity Stones */}
                        {/* 1. Mind Stone (Yellow - Center Palm) */}
                        <polygon points="12,12 13.5,13.5 12,15 10.5,13.5" fill="#ffeb3b" filter="drop-shadow(0 0 2px #ffeb3b)" />
                        {/* 2. Power Stone (Purple - Knuckle) */}
                        <circle cx="9.5" cy="10" r="1.1" fill="#ba68c8" filter="drop-shadow(0 0 1.5px #ba68c8)" />
                        {/* 3. Space Stone (Blue - Knuckle) */}
                        <circle cx="12.5" cy="9.5" r="1.1" fill="#00d4ff" filter="drop-shadow(0 0 1.5px #00d4ff)" />
                        {/* 4. Reality Stone (Red - Knuckle) */}
                        <circle cx="15.5" cy="10" r="1.1" fill="#ff1744" filter="drop-shadow(0 0 1.5px #ff1744)" />
                        {/* 5. Soul Stone (Orange - Knuckle) */}
                        <circle cx="17" cy="12" r="1" fill="#ff9100" filter="drop-shadow(0 0 1.5px #ff9100)" />
                        {/* 6. Time Stone (Green - Thumb) */}
                        <circle cx="7.5" cy="12.5" r="1" fill="#00e676" filter="drop-shadow(0 0 1.5px #00e676)" />

                        <defs>
                            <linearGradient id="gauntletGold" x1="6" y1="4" x2="18" y2="22" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#ffd700" />
                                <stop offset="0.5" stopColor="#ffb300" />
                                <stop offset="1" stopColor="#b8860b" />
                            </linearGradient>
                        </defs>
                    </svg>
                )}
            </button>

            {/* Fullscreen Particle Disintegration Canvas */}
            <canvas ref={canvasRef} className="thanos-particle-canvas" />

            {/* Cosmic Shockwave Flash Overlay */}
            {flash && <div className="thanos-cosmic-flash" />}

            {/* Time Stone Reversal Mystic Ring */}
            {timeRing && <div className="thanos-time-ring" />}

            {/* Cinematic Toast Notification */}
            {toast && (
                <div className={`thanos-cinematic-toast ${toast.type}`}>
                    <i className={`fas ${toast.type === 'snap' ? 'fa-skull text-gold' : 'fa-hourglass-start text-green'}`} />
                    <div>
                        <span style={{ color: toast.type === 'snap' ? '#ffd700' : '#00ff88', marginRight: '6px' }}>{toast.message}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{toast.quote}</span>
                    </div>
                </div>
            )}
        </>
    );
}
