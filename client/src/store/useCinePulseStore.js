import { create } from 'zustand';

/**
 * CinePulse Global Store (Zustand)
 * Manages cross-component state to eliminate prop-drilling.
 */
export const useCinePulseStore = create((set) => ({
    // ── Search Modal ──────────────────────────────────────────────
    searchOpen: false,
    openSearch: () => set({ searchOpen: true }),
    closeSearch: () => set({ searchOpen: false }),
    toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),

    // ── Active Hub (Homepage MultiHub pills) ──────────────────────
    activeHub: 'trending',
    setActiveHub: (hub) => set({ activeHub: hub }),

    // ── Player State ──────────────────────────────────────────────
    currentMedia: null,
    setCurrentMedia: (media) => set({ currentMedia: media }),
    clearCurrentMedia: () => set({ currentMedia: null }),
}));
