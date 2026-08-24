import React from 'react';

export default class ComponentErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.warn(`[ComponentErrorBoundary] Captured localized render exception in ${this.props.name || 'sub-component'}:`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: 'rgba(255, 81, 104, 0.08)',
                    border: '1px solid rgba(255, 81, 104, 0.2)',
                    color: 'var(--text-secondary, #9496a1)',
                    fontSize: '13px',
                    margin: '12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fas fa-triangle-exclamation" style={{ color: 'var(--brand, #ff5168)' }}></i>
                        <span>{this.props.name || 'Component'} encountered a temporary render anomaly.</span>
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#fff',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                        }}
                    >
                        Retry Widget
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
