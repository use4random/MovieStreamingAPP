import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/thanos.css';

/**
 * FIDEV.IO / SNAPPABLE (Marcin Szałek) Thanos Snap Disintegration Algorithm
 * Reference: https://fidev.io/thanos-snap-effect-in-flutter/
 *
 * Architecture:
 * 1. Decomposition: Elements are split into `NUMBER_OF_BUCKETS` (16) discrete layers.
 * 2. Directional Weights: Pixels are weighted by vertical (y) and horizontal (x) position
 *    so the top-right / top edge turns to dust first, flowing organically downward.
 * 3. Layer Dispersal: Each bucket animates with staggered interval curves, random wind angles,
 *    velocity offsets, thermal lift, and rotation.
 * 4. Time Stone Reversal: The animation controller can rewind in reverse to reconstitute
 *    all layers back into the original content.
 */
const NUMBER_OF_BUCKETS = 16;
const SNAP_DURATION_MS = 2400;

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
            // High-frequency finger snap click (noise transient)
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
            noiseGain.gain.setValueAtTime(0.85, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

            noise.connect(snapFilter);
            snapFilter.connect(noiseGain);
            noiseGain.connect(audioCtx.destination);
            noise.start(t);

            // Body pop
            const popOsc = audioCtx.createOscillator();
            const popGain = audioCtx.createGain();
            popOsc.type = 'triangle';
            popOsc.frequency.setValueAtTime(380, t);
            popOsc.frequency.exponentialRampToValueAtTime(90, t + 0.05);
            popGain.gain.setValueAtTime(0.65, t);
            popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            popOsc.connect(popGain);
            popGain.connect(audioCtx.destination);
            popOsc.start(t);
            popOsc.stop(t + 0.06);

            // Cosmic cinematic sub-rumble
            const subOsc = audioCtx.createOscillator();
            const subGain = audioCtx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(75, t + 0.02);
            subOsc.frequency.exponentialRampToValueAtTime(24, t + 1.4);
            subGain.gain.setValueAtTime(0.5, t + 0.02);
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

// Cubic ease-out curve matching Flutter Curves.easeOut
function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}

export default function ThanosSnap() {
    const [isSnapped, setIsSnapped] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [flash, setFlash] = useState(false);
    const [timeRing, setTimeRing] = useState(false);
    const [toast, setToast] = useState(null);

    const canvasRef = useRef(null);
    const layersRef = useRef([]); // Stores fidev.io 16-bucket layers
    const snappedElementsRef = useRef([]);
    const animFrameRef = useRef(null);
    const toastTimerRef = useRef(null);
    const location = useLocation();

    const showToast = (message, type = 'snap', quote = '') => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ message, type, quote });
        toastTimerRef.current = setTimeout(() => setToast(null), 3600);
    };

    const restoreAllElements = useCallback(() => {
        if (snappedElementsRef.current.length > 0) {
            snappedElementsRef.current.forEach(el => {
                if (el && el.classList) {
                    el.classList.remove('snappable-dissolved');
                    el.classList.remove('snappable-restoring');
                    el.style.visibility = '';
                    el.style.opacity = '';
                    el.style.transform = '';
                    el.style.filter = '';
                }
            });
            snappedElementsRef.current = [];
        }
        layersRef.current = [];
        setIsSnapped(false);
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

    useEffect(() => {
        return () => {
            restoreAllElements();
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, [restoreAllElements]);

    /**
     * Decomposes target DOM elements into 16 weighted bucket layers as defined by Fidev.io
     */
    const buildFidevLayers = (elements) => {
        const layers = [];
        const ashColors = ['#424242', '#616161', '#757575', '#9e9e9e', '#bcaaa4', '#37474f', '#212121'];
        const emberColors = ['#ff7043', '#ffab40', '#ffd54f'];

        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;

            // Generate buckets for this element
            const elementBuckets = Array.from({ length: NUMBER_OF_BUCKETS }, (_, bIndex) => {
                // Interval curve for this bucket layer
                const startInterval = (bIndex / NUMBER_OF_BUCKETS) * 0.58;
                const endInterval = Math.min(1.0, startInterval + 0.42);

                // Flight physics parameters per bucket
                const angle = -0.18 + (Math.random() - 0.5) * 0.45; // drifting right and upward
                const distance = 160 + Math.random() * 200;
                const rotation = (Math.random() - 0.5) * 1.6;
                const lift = 35 + Math.random() * 45;

                return {
                    index: bIndex,
                    startInterval,
                    endInterval,
                    angle,
                    distance,
                    rotation,
                    lift,
                    particles: []
                };
            });

            // Sample particle grid across the element using Fidev.io probability distribution
            const sampleStep = 12; // grid resolution
            for (let y = 0; y < rect.height; y += sampleStep) {
                for (let x = 0; x < rect.width; x += sampleStep) {
                    const normX = x / rect.width;
                    const normY = y / rect.height;

                    // FIDEV.IO DIRECTIONAL WEIGHT FORMULA:
                    // Pixels higher up and to the right disintegrate into earlier buckets first
                    const weight = (normY * 0.65 + normX * 0.35);
                    const randomizedWeight = weight + (Math.random() - 0.5) * 0.28;
                    const bucketIndex = Math.min(
                        NUMBER_OF_BUCKETS - 1,
                        Math.max(0, Math.floor(randomizedWeight * NUMBER_OF_BUCKETS))
                    );

                    const isEmber = Math.random() < 0.15;
                    elementBuckets[bucketIndex].particles.push({
                        originX: rect.left + x + (Math.random() - 0.5) * 6,
                        originY: rect.top + y + (Math.random() - 0.5) * 6,
                        size: isEmber ? Math.random() * 2.2 + 1.2 : Math.random() * 3.5 + 1.8,
                        color: isEmber ? emberColors[Math.floor(Math.random() * emberColors.length)] : ashColors[Math.floor(Math.random() * ashColors.length)],
                        isEmber
                    });
                }
            }

            layers.push(...elementBuckets);
        });

        return layers;
    };

    /**
     * Animation Loop implementing Fidev.io's AnimationController & Interval logic
     */
    const animateFidevSnap = (layers, isReverse = false, onComplete) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const startTime = performance.now();

        const renderFrame = (now) => {
            const elapsed = now - startTime;
            let rawProgress = Math.min(1.0, elapsed / SNAP_DURATION_MS);
            let progress = isReverse ? (1.0 - rawProgress) : rawProgress;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Animate each of the 16 bucket layers independently according to its interval curve
            layers.forEach(bucket => {
                let layerProgress = 0;
                if (progress <= bucket.startInterval) {
                    layerProgress = 0;
                } else if (progress >= bucket.endInterval) {
                    layerProgress = 1.0;
                } else {
                    layerProgress = (progress - bucket.startInterval) / (bucket.endInterval - bucket.startInterval);
                }

                // If layer is fully dissipated or hasn't started, skip rendering
                if (layerProgress <= 0 && isReverse) return;
                if (layerProgress >= 1.0 && !isReverse) return;

                const curvedProgress = easeOutCubic(layerProgress);
                const alpha = Math.max(0, 1.0 - curvedProgress);
                const offsetX = Math.cos(bucket.angle) * bucket.distance * curvedProgress;
                const offsetY = Math.sin(bucket.angle) * bucket.distance * curvedProgress - (curvedProgress * curvedProgress * bucket.lift);
                const currentRot = bucket.rotation * curvedProgress;

                ctx.save();
                ctx.globalAlpha = alpha;

                bucket.particles.forEach(p => {
                    const currentX = p.originX + offsetX;
                    const currentY = p.originY + offsetY;

                    ctx.save();
                    ctx.translate(currentX, currentY);
                    ctx.rotate(currentRot);
                    ctx.fillStyle = p.color;

                    if (p.isEmber) {
                        ctx.shadowBlur = 8;
                        ctx.shadowColor = '#ffab40';
                        ctx.beginPath();
                        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.85);
                    }
                    ctx.restore();
                });

                ctx.restore();
            });

            if (rawProgress < 1.0) {
                animFrameRef.current = requestAnimationFrame(renderFrame);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (onComplete) onComplete();
            }
        };

        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    // ── TRIGGER THANOS SNAP (FIDEV.IO ALGORITHM) ───────────────────────────
    const handleSnap = () => {
        if (isAnimating) return;
        setIsAnimating(true);

        // 1. Play snap audio
        thanosAudio.playSnapSound();

        // 2. Cosmic Screen Flash
        setFlash(true);
        setTimeout(() => setFlash(false), 850);

        // 3. Select 50% of candidate content widgets
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

        const candidates = Array.from(document.querySelectorAll(targetSelectors.join(','))).filter(el => {
            if (el.closest('.site-header') || el.closest('#playerSection') || el.closest('.auth-modal') || el.closest('.thanos-snap-btn')) {
                return false;
            }
            const r = el.getBoundingClientRect();
            return r.width > 30 && r.height > 30 && r.bottom > 0 && r.top < window.innerHeight;
        });

        let pool = candidates;
        if (pool.length < 4) {
            pool = Array.from(document.querySelectorAll('.main-content > *, .content-grid > *')).filter(el => {
                const r = el.getBoundingClientRect();
                return r.width > 40 && r.height > 40 && r.bottom > 0 && r.top < window.innerHeight;
            });
        }

        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const victims = shuffled.slice(0, Math.ceil(pool.length / 2));
        snappedElementsRef.current = victims;

        // 4. Construct Fidev.io 16-bucket layers
        const layers = buildFidevLayers(victims);
        layersRef.current = layers;

        // Stagger fade out of victim DOM elements in sync with bucket layers
        victims.forEach((el, elIdx) => {
            const delay = (elIdx * 70) % 500;
            setTimeout(() => {
                el.classList.add('snappable-dissolved');
            }, delay);
        });

        // 5. Run Fidev.io Layer Animation Loop
        animateFidevSnap(layers, false, () => {
            setIsAnimating(false);
        });

        setIsSnapped(true);
        showToast('“I am inevitable.”', 'snap', '50% of the screen turned into 16 dust layers. Click Time Stone to restore.');
    };

    // ── TRIGGER TIME STONE REVERSE (RESTORE ALL LAYERS) ────────────────────
    const handleRestore = () => {
        if (isAnimating) return;
        setIsAnimating(true);

        // 1. Play Time Stone mystical reverse sound
        thanosAudio.playTimeReverseSound();

        // 2. Expanding green mystic time ring
        setTimeRing(true);
        setTimeout(() => setTimeRing(false), 1250);

        const victims = snappedElementsRef.current;
        const layers = layersRef.current;

        // Animate buckets converging in reverse (1.0 -> 0.0)
        animateFidevSnap(layers, true, () => {
            victims.forEach(el => {
                if (el && el.classList) {
                    el.classList.remove('snappable-dissolved');
                    el.classList.add('snappable-restoring');
                }
            });

            setTimeout(() => {
                victims.forEach(el => {
                    if (el && el.classList) {
                        el.classList.remove('snappable-restoring');
                    }
                });
                snappedElementsRef.current = [];
                layersRef.current = [];
                setIsSnapped(false);
                setIsAnimating(false);
            }, 1400);
        });

        showToast('“I am Iron Man.”', 'restore', 'The 16 layers have reassembled. Universe restored.');
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
                        <path
                            d="M6 13C6 11 8 8 11 8V5.5C11 4.7 11.7 4 12.5 4C13.3 4 14 4.7 14 5.5V8.5C14 8.5 15.2 8.5 16 9C16.8 9.5 17.5 10.5 17.5 12V14.5C17.5 17 15.5 19 13 19H10C7.8 19 6 17.2 6 15V13Z"
                            fill="url(#gauntletGold)"
                            stroke="#ffe066"
                            strokeWidth="1.1"
                        />
                        <path d="M7 19H16V21C16 21.6 15.6 22 15 22H8C7.4 22 7 21.6 7 21V19Z" fill="#b8860b" />
                        <polygon points="12,12 13.5,13.5 12,15 10.5,13.5" fill="#ffeb3b" filter="drop-shadow(0 0 2px #ffeb3b)" />
                        <circle cx="9.5" cy="10" r="1.1" fill="#ba68c8" filter="drop-shadow(0 0 1.5px #ba68c8)" />
                        <circle cx="12.5" cy="9.5" r="1.1" fill="#00d4ff" filter="drop-shadow(0 0 1.5px #00d4ff)" />
                        <circle cx="15.5" cy="10" r="1.1" fill="#ff1744" filter="drop-shadow(0 0 1.5px #ff1744)" />
                        <circle cx="17" cy="12" r="1" fill="#ff9100" filter="drop-shadow(0 0 1.5px #ff9100)" />
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

            {/* Fidev.io Fullscreen 16-Bucket Particle Disintegration Canvas */}
            <canvas ref={canvasRef} className="thanos-particle-canvas" />

            {/* Cosmic Shockwave Flash Overlay */}
            {flash && <div className="thanos-cosmic-flash" />}

            {/* Time Stone Cosmic Reversal Mystic Ring */}
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

/**
 * Reusable <Snappable> wrapper component inspired by Snappable in Flutter (fidev.io)
 * Can wrap any individual widget/card to make it snappable
 */
export function Snappable({ children, className = '', id, onSnapped, ...props }) {
    return (
        <div className={`snappable-container ${className}`} id={id} {...props}>
            {children}
        </div>
    );
}
