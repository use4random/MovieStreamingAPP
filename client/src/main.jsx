import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { WatchlistProvider } from './context/WatchlistContext';
import { AudioProvider } from './context/AudioContext';
import './styles/cyber.css';

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
            <BrowserRouter>
                <AudioProvider>
                    <WatchlistProvider>
                        <App />
                    </WatchlistProvider>
                </AudioProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>
);

