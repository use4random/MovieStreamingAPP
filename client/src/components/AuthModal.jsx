import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
    const { authModalOpen, authMode, setAuthMode, closeAuthModal, login, register } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const firstInputRef = useRef(null);

    // Prevent body scrolling and attach Escape key listener when modal is open
    useEffect(() => {
        if (!authModalOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeAuthModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Auto-focus first input
        const timer = setTimeout(() => {
            if (firstInputRef.current) {
                firstInputRef.current.focus();
            }
        }, 80);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timer);
        };
    }, [authModalOpen, authMode]);

    if (!authModalOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (authMode === 'login') {
                await login(identifier, password);
            } else {
                await register(username, email, password);
            }
            // Reset fields on success
            setIdentifier('');
            setUsername('');
            setEmail('');
            setPassword('');
        } catch (err) {
            setError(err.message || 'Authentication failed. Please check your details and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            closeAuthModal();
        }
    };

    const switchMode = (newMode) => {
        setError('');
        setAuthMode(newMode);
    };

    return (
        <div 
            className="auth-modal-overlay" 
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-label={authMode === 'login' ? 'Account Login' : 'Create Account'}
        >
            <div 
                className="auth-modal-box" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="auth-modal-header-row">
                    <div className="auth-modal-title">
                        <i className={`fas ${authMode === 'login' ? 'fa-shield-halved' : 'fa-user-plus'} text-brand`} style={{ fontSize: '22px' }}></i>
                        <h2>{authMode === 'login' ? 'Account Login' : 'Create Account'}</h2>
                    </div>
                    <button 
                        type="button"
                        className="auth-close-btn"
                        onClick={closeAuthModal}
                        aria-label="Close authentication modal"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Mode Tabs */}
                <div className="auth-modal-tabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={authMode === 'login'}
                        className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                        onClick={() => switchMode('login')}
                    >
                        <i className="fas fa-right-to-bracket"></i>
                        <span>Sign In</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={authMode === 'register'}
                        className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                        onClick={() => switchMode('register')}
                    >
                        <i className="fas fa-user-plus"></i>
                        <span>Sign Up</span>
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="auth-error-alert" role="alert">
                        <i className="fas fa-circle-exclamation" style={{ fontSize: '16px' }}></i>
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="auth-form" noValidate={false}>
                    {authMode === 'login' ? (
                        <div className="auth-input-group">
                            <label className="auth-input-label" htmlFor="auth-identifier">
                                Username or Email
                            </label>
                            <div className="auth-input-wrapper">
                                <i className="fas fa-user auth-input-icon"></i>
                                <input
                                    ref={firstInputRef}
                                    id="auth-identifier"
                                    type="text"
                                    className="auth-text-input"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Username or email address"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="auth-input-group">
                                <label className="auth-input-label" htmlFor="auth-username">
                                    Username
                                </label>
                                <div className="auth-input-wrapper">
                                    <i className="fas fa-user-tag auth-input-icon"></i>
                                    <input
                                        ref={firstInputRef}
                                        id="auth-username"
                                        type="text"
                                        className="auth-text-input"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Choose a username (min. 3 chars)"
                                        required
                                        minLength={3}
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div className="auth-input-group">
                                <label className="auth-input-label" htmlFor="auth-email">
                                    Email Address
                                </label>
                                <div className="auth-input-wrapper">
                                    <i className="fas fa-envelope auth-input-icon"></i>
                                    <input
                                        id="auth-email"
                                        type="email"
                                        className="auth-text-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="user@cinepulse.io"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="auth-input-group">
                        <div className="auth-input-label">
                            <label htmlFor="auth-password">Password</label>
                            {authMode === 'register' && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Min. 6 characters</span>
                            )}
                        </div>
                        <div className="auth-input-wrapper">
                            <i className="fas fa-lock auth-input-icon"></i>
                            <input
                                id="auth-password"
                                type={showPassword ? 'text' : 'password'}
                                className="auth-text-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={authMode === 'login' ? '••••••••••••' : 'Create strong password'}
                                required
                                minLength={6}
                                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <i className={`fas ${authMode === 'login' ? 'fa-right-to-bracket' : 'fa-user-check'}`}></i>
                                <span>{authMode === 'login' ? 'AUTHENTICATE SESSION' : 'REGISTER PROFILE'}</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Footer Switcher */}
                <div className="auth-footer-toggle">
                    {authMode === 'login' ? (
                        <span>
                            Don't have a profile yet?{' '}
                            <button
                                type="button"
                                className="auth-link-btn"
                                onClick={() => switchMode('register')}
                            >
                                Sign Up Now
                            </button>
                        </span>
                    ) : (
                        <span>
                            Already registered?{' '}
                            <button
                                type="button"
                                className="auth-link-btn"
                                onClick={() => switchMode('login')}
                            >
                                Log In
                            </button>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
