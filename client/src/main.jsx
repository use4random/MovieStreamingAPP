import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { WatchlistProvider } from './context/WatchlistContext';
import { AudioProvider } from './context/AudioContext';
import './styles/cyber.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AudioProvider>
                <WatchlistProvider>
                    <App />
                </WatchlistProvider>
            </AudioProvider>
        </BrowserRouter>
    </React.StrictMode>
);
