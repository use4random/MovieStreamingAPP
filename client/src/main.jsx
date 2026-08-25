import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { AudioProvider } from './context/AudioContext';
import './styles/theme.css';

// ── React Query client with 5-min stale time ──────────────────────────
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,       // 5 minutes
            gcTime: 10 * 60 * 1000,          // 10 minutes garbage collection
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

// ── web-vitals reporting ──────────────────────────────────────────────
function reportWebVitals(metric) {
    if (import.meta.env.DEV) {
        console.log(`[web-vitals] ${metric.name}:`, Math.round(metric.value), metric.rating);
    } else {
        // Send to server in production (fire-and-forget)
        try {
            navigator.sendBeacon('/api/vitals', JSON.stringify({
                name: metric.name,
                value: metric.value,
                rating: metric.rating,
                id: metric.id,
            }));
        } catch {/* ignore */}
    }
}

// Dynamically import web-vitals only when needed
import('web-vitals').then(({ onCLS, onLCP, onFID, onFCP, onTTFB }) => {
    onCLS(reportWebVitals);
    onLCP(reportWebVitals);
    onFID(reportWebVitals);
    onFCP(reportWebVitals);
    onTTFB(reportWebVitals);
}).catch(() => {/* silently fail */});


class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("React ErrorBoundary caught an exception:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',

                    background: '#111317',
                    color: '#fff',
                    padding: '24px',
                    textAlign: 'center',
                    fontFamily: 'sans-serif'
                }}>
                    <h1 style={{ fontSize: '24px', color: '#ff5168', marginBottom: '12px' }}>Quantum Gateway Recovery</h1>
                    <p style={{ color: '#9496a1', marginBottom: '20px' }}>Something caused a rendering glitch. Click below to reload the app interface.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            background: '#ff5168',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <AudioProvider>
                        <AuthProvider>
                            <WatchlistProvider>
                                <App />
                            </WatchlistProvider>
                        </AuthProvider>
                    </AudioProvider>
                </BrowserRouter>
            </QueryClientProvider>
        </ErrorBoundary>
    </React.StrictMode>
);


