import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
    const { authModalOpen, authMode, setAuthMode, closeAuthModal, login, register } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
            // Reset fields
            setIdentifier('');
            setUsername('');
            setEmail('');
            setPassword('');
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="search-modal-backdrop" onClick={closeAuthModal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div 
                className="search-modal-content" 
                onClick={(e) => e.stopPropagation()} 
                style={{ maxWidth: '440px', width: '90%', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255, 81, 104, 0.3)', background: '#0a0c16', boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(255, 81, 104, 0.15)' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-shield-halved text-brand" style={{ fontSize: '20px' }}></i>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '0.5px', margin: 0 }}>
                            {authMode === 'login' ? 'CYBER PASS LOGIN' : 'CREATE CYBER ACCOUNT'}
                        </h2>
                    </div>
                    <button 
                        onClick={closeAuthModal}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}
                    >
                        <i className="fas fa-xmark"></i>
                    </button>
                </div>

                {error && (
                    <div style={{ padding: '12px 16px', background: 'rgba(255, 81, 104, 0.12)', border: '1px solid rgba(255, 81, 104, 0.4)', borderRadius: '8px', color: 'var(--brand)', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-circle-exclamation"></i>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {authMode === 'login' ? (
                        <div>
                            <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Username or Email</label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="cyber_pilot or user@cinepulse.io"
                                required
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '14px', outline: 'none' }}
                            />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="cyber_pilot"
                                    required
                                    minLength={3}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '14px', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@cinepulse.io"
                                    required
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '14px', outline: 'none' }}
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            required
                            minLength={6}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '14px', outline: 'none' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '8px',
                            padding: '14px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, var(--brand) 0%, #b81d24 100%)',
                            border: 'none',
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: '14px',
                            letterSpacing: '1px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 20px rgba(255, 81, 104, 0.4)'
                        }}
                    >
                        {loading ? (
                            <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                            <>
                                <i className={`fas ${authMode === 'login' ? 'fa-right-to-bracket' : 'fa-user-plus'}`}></i>
                                {authMode === 'login' ? 'AUTHENTICATE SESSION' : 'REGISTER PROFILE'}
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {authMode === 'login' ? (
                        <>
                            Don't have a profile yet?{' '}
                            <button
                                onClick={() => { setError(''); setAuthMode('register'); }}
                                style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                            >
                                Register Cyber Account
                            </button>
                        </>
                    ) : (
                        <>
                            Already registered?{' '}
                            <button
                                onClick={() => { setError(''); setAuthMode('login'); }}
                                style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                            >
                                Log In
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
