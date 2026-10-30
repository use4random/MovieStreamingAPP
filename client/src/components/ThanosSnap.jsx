import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/thanos.css';

/**
 * FIDEV.IO / SNAPPABLE (Marcin Szałek) Thanos Snap Disintegration Algorithm
 * Reference: https://fidev.io/thanos-snap-effect-in-flutter/
 *
 * Full-Page Architecture:
 * 1. Decomposition: Elements and visible page content are split into `NUMBER_OF_BUCKETS` (16) discrete layers.
 * 2. Directional Weights: Pixels and elements are weighted by vertical (y) and horizontal (x) position
 *    (normY * 0.62 + (1.0 - normX) * 0.38) so the top-right / upper edge turns to dust first, flowing organically downward to bottom-left.
 * 3. Whole-Page Application: Applies across the entire page (Video Player HUD, Hero Carousel, Bento grids,
 *    Content Grids, Sidebar, Detail rows, and Footer), while preserving the navigation header so the user can reverse the snap.
 * 4. Layer Dispersal: Each bucket animates with staggered interval curves, random wind angles,
 *    velocity offsets, thermal lift, and rotation.
 * 5. Time Stone Reversal: The animation controller can rewind in reverse to reconstitute
 *    all 16 layers back into the original content cleanly without breaking playback or page layout.
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
            // 1. High-frequency finger snap click (noise transient)
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

            // 2. Body pop
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

            // 3. Cosmic cinematic sub-rumble
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
            // Harmonic mystic chime chord (Doctor Strange time stone rewind arpeggio)
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
                    el.classList.remove('snappable-container-dissolved');
                    el.classList.remove('snappable-container-restoring');
                    delete el.dataset.isContainer;
                    el.style.visibility = '';
                    el.style.opacity = '';
                    el.style.transform = '';
                    el.style.filter = '';
                }
            });
            snappedElementsRef.current = [];
        }

        const header = document.getElementById('siteHeader');
        if (header) header.classList.remove('thanos-universe-snapped');

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
     * Decomposes the whole page and visible elements into 16 weighted bucket layers as defined by Fidev.io
     * Directional weighting: top-right dissolved into earlier buckets (0..4), middle into (5..11), bottom-left into (12..15).
     */
    const buildFidevLayers = (elements) => {
        const layers = Array.from({ length: NUMBER_OF_BUCKETS }, (_, bIndex) => {
            // Interval curve matching Flutter Curves.easeOut / Interval
            const startInterval = (bIndex / NUMBER_OF_BUCKETS) * 0.54;
            const endInterval = Math.min(1.0, startInterval + 0.46);

            // Directional drift: top-right wind direction (-0.2 rad ≈ -11 deg) + organic variance
            const angle = -0.2 + (Math.random() - 0.5) * 0.4;
            const distance = 180 + Math.random() * 220;
            const rotation = (Math.random() - 0.5) * 1.8;
            const lift = 45 + Math.random() * 55;

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

        const ashColors = ['#262626', '#3d3d3d', '#525252', '#6e6e6e', '#888888', '#9e9e9e', '#bcaaa4', '#1f2427'];
        const emberColors = ['#ff5722', '#ff9800', '#ffb74d', '#ffd54f', '#ff7043', '#00ff88', '#ba68c8'];

        const viewW = window.innerWidth;
        const viewH = window.innerHeight;
        const topOffset = 70; // protect header area
        const contentH = Math.max(100, viewH - topOffset);

        // Dynamic particle count scaled to screen size for smooth 60 FPS
        const totalTargetParticles = Math.min(2200, Math.max(1000, Math.floor((viewW * viewH) / 950)));

        // Collect visible bounding boxes of content on screen
        const visibleBoxes = [];
        elements.forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.bottom > topOffset && r.top < viewH && r.right > 0 && r.left < viewW && r.width > 20 && r.height > 20) {
                visibleBoxes.push({
                    x1: Math.max(0, r.left),
                    y1: Math.max(topOffset, r.top),
                    x2: Math.min(viewW, r.right),
                    y2: Math.min(viewH, r.bottom),
                    area: (Math.min(viewW, r.right) - Math.max(0, r.left)) * (Math.min(viewH, r.bottom) - Math.max(topOffset, r.top))
                });
            }
        });

        // Helper to assign a screen coordinate to a Fidev.io layer bucket
        const assignToBucket = (x, y) => {
            const normX = Math.min(1, Math.max(0, x / viewW));
            const normY = Math.min(1, Math.max(0, (y - topOffset) / contentH));

            // FIDEV DIRECTIONAL WEIGHT FORMULA:
            // Top-right corner dissolves first (normY = 0, normX = 1 -> weight = 0 -> bucket 0)
            // Bottom-left dissolves last (normY = 1, normX = 0 -> weight = 1 -> bucket 15)
            const directionalWeight = normY * 0.62 + (1.0 - normX) * 0.38;
            const randomized = directionalWeight + (Math.random() - 0.5) * 0.28;
            return Math.min(NUMBER_OF_BUCKETS - 1, Math.max(0, Math.floor(randomized * NUMBER_OF_BUCKETS)));
        };

        const elementParticleCount = Math.floor(totalTargetParticles * 0.75);
        const ambientParticleCount = totalTargetParticles - elementParticleCount;

        // A. Sample particles from visible elements on screen
        if (visibleBoxes.length > 0) {
            const totalArea = visibleBoxes.reduce((acc, b) => acc + b.area, 0);
            visibleBoxes.forEach(box => {
                const count = Math.max(3, Math.floor((box.area / totalArea) * elementParticleCount));
                for (let i = 0; i < count; i++) {
                    const px = box.x1 + Math.random() * (box.x2 - box.x1);
                    const py = box.y1 + Math.random() * (box.y2 - box.y1);
                    const bIdx = assignToBucket(px, py);

                    const isEmber = Math.random() < 0.22;
                    layers[bIdx].particles.push({
                        originX: px,
                        originY: py,
                        size: isEmber ? Math.random() * 2.8 + 1.2 : Math.random() * 3.6 + 1.8,
                        color: isEmber ? emberColors[Math.floor(Math.random() * emberColors.length)] : ashColors[Math.floor(Math.random() * ashColors.length)],
                        isEmber
                    });
                }
            });
        }

        // B. Full-screen ambient dust blanket across entire visible page
        for (let i = 0; i < ambientParticleCount; i++) {
            const px = Math.random() * viewW;
            const py = topOffset + Math.random() * contentH;
            const bIdx = assignToBucket(px, py);

            const isEmber = Math.random() < 0.2;
            layers[bIdx].particles.push({
                originX: px,
                originY: py,
                size: isEmber ? Math.random() * 2.4 + 1.0 : Math.random() * 3.2 + 1.5,
                color: isEmber ? emberColors[Math.floor(Math.random() * emberColors.length)] : ashColors[Math.floor(Math.random() * ashColors.length)],
                isEmber
            });
        }

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
                        ctx.shadowColor = p.color;
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

    // ── TRIGGER THANOS SNAP ACROSS THE WHOLE PAGE (FIDEV.IO ALGORITHM) ────
    const handleSnap = () => {
        if (isAnimating) return;
        setIsAnimating(true);

        // 1. Play snap audio
        thanosAudio.playSnapSound();

        // 2. Cosmic Screen Flash
        setFlash(true);
        setTimeout(() => setFlash(false), 850);

        // 3. Mark site header with universe altered aura
        const header = document.getElementById('siteHeader');
        if (header) header.classList.add('thanos-universe-snapped');

        // 4. Collect ALL content sections and components across the whole page
        const containerSelectors = [
            '#mainContent',
            '.main-content',
            '.sidebar',
            '.site-footer',
            'footer',
            '#playerSection',
            '.player-section'
        ];
        const containers = Array.from(document.querySelectorAll(containerSelectors.join(','))).filter(el => {
            return !el.closest('#siteHeader') && !el.closest('.thanos-snap-btn');
        });

        const itemSelectors = [
            '#playerSection > *',
            '.player-section > *',
            '.player-hud-wrap',
            '.hero-carousel',
            '.hero-carousel-slide',
            '.detail-header-row',
            '.mobile-details-container',
            '.mobile-backdrop-header',
            '.bento-card',
            '.glass-card',
            '.glass-panel',
            '.movie-card',
            '.content-grid > *',
            '.network-card',
            '.watchlist-card',
            '.sidebar-widget',
            '.recommendations-wrap',
            'main section',
            '#mainContent > *',
            '.sidebar > *',
            '.site-footer > *'
        ];
        const items = Array.from(document.querySelectorAll(itemSelectors.join(','))).filter(el => {
            if (el.closest('#siteHeader') || el.closest('.thanos-snap-btn') || el.classList.contains('thanos-snap-btn')) return false;
            if (el.classList.contains('thanos-particle-canvas') || el.classList.contains('thanos-cosmic-flash') || el.classList.contains('thanos-time-ring') || el.classList.contains('thanos-cinematic-toast')) return false;
            return true;
        });

        let allItems = Array.from(new Set(items));
        if (allItems.length < 5) {
            const fallback = Array.from(document.querySelectorAll('.site-container *')).filter(el => {
                if (el.closest('#siteHeader') || el.closest('.thanos-snap-btn')) return false;
                const r = el.getBoundingClientRect();
                return r.width > 50 && r.height > 50;
            });
            allItems = Array.from(new Set([...allItems, ...fallback]));
        }

        // Tag container elements for distinct smooth container-level dissolve
        containers.forEach(c => {
            c.dataset.isContainer = 'true';
        });

        const allVictims = Array.from(new Set([...allItems, ...containers]));
        snappedElementsRef.current = allVictims;

        // 5. Construct Fidev.io 16-bucket layers across whole page
        const layers = buildFidevLayers(allItems);
        layersRef.current = layers;

        // 6. Stagger fade out of victim elements according to their Fidev directional weight (top-right to bottom-left)
        const viewW = window.innerWidth;
        const viewH = window.innerHeight;

        allItems.forEach((el) => {
            const r = el.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const normX = Math.min(1, Math.max(0, cx / viewW));
            const normY = Math.min(1, Math.max(0, cy / viewH));
            // Fidev directional weight formula:
            const weight = normY * 0.62 + (1.0 - normX) * 0.38;
            const delay = Math.min(650, Math.max(0, Math.floor(weight * 600 + (Math.random() - 0.5) * 80)));

            setTimeout(() => {
                if (el && el.classList) {
                    el.classList.add('snappable-dissolved');
                }
            }, delay);
        });

        // Containers dissolve smoothly near the middle of the wave
        containers.forEach(c => {
            setTimeout(() => {
                if (c && c.classList) {
                    c.classList.add('snappable-container-dissolved');
                }
            }, 380);
        });

        // 7. Run Fidev.io Layer Animation Loop
        animateFidevSnap(layers, false, () => {
            setIsAnimating(false);
        });

        setIsSnapped(true);
        showToast('“I am inevitable.”', 'snap', 'The entire page disintegrated into 16 dust layers. Click Time Stone to restore.');
    };

    // ── TRIGGER TIME STONE REVERSE (RESTORE THE ENTIRE PAGE) ──────────────
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

        const header = document.getElementById('siteHeader');
        if (header) header.classList.remove('thanos-universe-snapped');

        // 3. Animate buckets converging in reverse (1.0 -> 0.0)
        animateFidevSnap(layers, true, () => {
            victims.forEach(el => {
                if (el && el.classList) {
                    el.classList.remove('snappable-dissolved');
                    el.classList.remove('snappable-container-dissolved');
                    if (el.dataset.isContainer === 'true') {
                        el.classList.add('snappable-container-restoring');
                    } else {
                        el.classList.add('snappable-restoring');
                    }
                }
            });

            setTimeout(() => {
                victims.forEach(el => {
                    if (el && el.classList) {
                        el.classList.remove('snappable-restoring');
                        el.classList.remove('snappable-container-restoring');
                        delete el.dataset.isContainer;
                        el.style.visibility = '';
                        el.style.opacity = '';
                        el.style.transform = '';
                        el.style.filter = '';
                    }
                });
                snappedElementsRef.current = [];
                layersRef.current = [];
                setIsSnapped(false);
                setIsAnimating(false);
            }, 1400);
        });

        showToast('“I am Iron Man.”', 'restore', 'The 16 layers have reassembled. Entire universe restored.');
    };

    return (
        <>
            {/* Thanos Snap / Time Stone Action Button */}
            <button
                type="button"
                className={`thanos-snap-btn ${isSnapped ? 'is-snapped' : ''}`}
                onClick={isSnapped ? handleRestore : handleSnap}
                title={isSnapped ? 'Time Stone: Reverse Snap (Restore Whole Page)' : 'Thanos Snap: Disintegrate Whole Page into Dust'}
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
