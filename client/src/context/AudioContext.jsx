import React, { createContext, useContext, useState, useRef } from 'react';

const AudioContext = createContext();

export function AudioProvider({ children }) {
    const [enabled, setEnabled] = useState(() => {
        return localStorage.getItem('mm_audio_fx') !== 'false';
    });

    const ctxRef = useRef(null);

    const initContext = () => {
        if (!ctxRef.current && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) ctxRef.current = new AudioCtx();
        }
        if (ctxRef.current && ctxRef.current.state === 'suspended') {
            ctxRef.current.resume().catch(() => {});
        }
    };

    const playClick = () => {
        if (!enabled) return;
        try {
            initContext();
            const ctx = ctxRef.current;
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } catch (e) {}
    };

    const playWhoosh = () => {
        if (!enabled) return;
        try {
            initContext();
            const ctx = ctxRef.current;
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(250, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.09);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.09);
        } catch (e) {}
    };

    const toggleAudio = () => {
        setEnabled(prev => {
            const next = !prev;
            localStorage.setItem('mm_audio_fx', next);
            return next;
        });
    };

    return (
        <AudioContext.Provider value={{ enabled, toggleAudio, playClick, playWhoosh }}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    return useContext(AudioContext);
}
