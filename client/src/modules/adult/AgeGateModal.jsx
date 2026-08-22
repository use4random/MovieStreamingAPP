import React, { useState } from 'react';

export default function AgeGateModal({ isOpen, onConfirm, onCancel }) {
    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState('');
    const storedPin = localStorage.getItem('cinepulse_adult_pin');

    if (!isOpen) return null;

    const handleUnlock = (e) => {
        e.preventDefault();
        if (storedPin) {
            if (pinInput === storedPin) {
                onConfirm();
            } else {
                setError('Incorrect security PIN. Please try again.');
            }
        } else {
            // First time setup or direct confirm
            if (pinInput.length === 4) {
                localStorage.setItem('cinepulse_adult_pin', pinInput);
            }
            onConfirm();
        }
    };

    return (
        <div className="modal-backdrop fade-in" style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 5, 12, 0.88)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="glass-card fade-in" style={{
                maxWidth: '440px',
                width: '100%',
                padding: '32px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 42, 109, 0.4)',
                boxShadow: '0 0 40px rgba(255, 42, 109, 0.25)',
                textAlign: 'center',
                background: 'linear-gradient(145deg, #180812 0%, #0d040a 100%)'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(255, 42, 109, 0.15)',
                    border: '1px solid rgba(255, 42, 109, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto',
                    color: '#ff2a6d'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>lock</span>
                </div>

                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
                    18+ Age Verification Required
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: '24px' }}>
                    This section contains mature content (NC-17 / TV-MA / 18+). You must be 18 years or older to proceed.
                </p>

                <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <input
                            type="password"
                            maxLength={4}
                            placeholder={storedPin ? 'Enter 4-Digit Security PIN' : 'Optional 4-Digit PIN (or leave blank)'}
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,42,109,0.3)',
                                color: '#fff',
                                fontSize: '15px',
                                textAlign: 'center',
                                letterSpacing: '4px',
                                outline: 'none'
                            }}
                        />
                        {error && <p style={{ color: '#ff2a6d', fontSize: '12px', marginTop: '6px' }}>{error}</p>}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.08)',
                                color: 'rgba(255,255,255,0.8)',
                                border: 'none',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            Exit / Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #ff2a6d 0%, #9b00e8 100%)',
                                color: '#fff',
                                border: 'none',
                                fontWeight: '800',
                                cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(255, 42, 109, 0.4)'
                            }}
                        >
                            I Am 18+ (Enter)
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
