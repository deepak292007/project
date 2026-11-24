import React from 'react';

interface PageShellProps {
  title: string;
  titleMr?: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({ title, titleMr, breadcrumb, actions, children }) => (
  <main className="app-main" role="main">
    <div className="page-title-bar">
      <div style={{ flex: 1 }}>
        {breadcrumb && (
          <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)', marginBottom: 2 }}>
            {breadcrumb}
          </div>
        )}
        <h1 style={{ fontSize: '1.125rem', margin: 0, lineHeight: 1.2 }}>
          {titleMr ? <>{titleMr} <span style={{ fontWeight: 400, color: 'var(--col-ink-muted)', fontSize: '0.9375rem' }}>· {title}</span></> : title}
        </h1>
      </div>
      {actions && <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{actions}</div>}
    </div>
    <div className="page-body fade-in">
      {children}
    </div>
  </main>
);

export const Footer: React.FC = () => (
  <footer className="gov-footer" role="contentinfo">
    <span>Government of Maharashtra</span>
    <span>·</span>
    <span>National Health Mission</span>
    <span>·</span>
    <span>ArogyaLink — SIH 2026 Prototype · Not for clinical use</span>
    <span>·</span>
    <span>Emergency: 108</span>
  </footer>
);

export const OfflineBanner: React.FC<{ pendingCount: number; onSync: () => void }> = ({ pendingCount, onSync }) => {
  if (pendingCount === 0) return null;
  return (
    <div className="offline-banner" role="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
      </svg>
      <span>{pendingCount} record{pendingCount > 1 ? 's' : ''} pending sync</span>
      <button onClick={onSync} className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }}>
        Sync Now
      </button>
    </div>
  );
};

export const EmptyState: React.FC<{ message: string; sub?: string }> = ({ message, sub }) => (
  <div style={{ textAlign: 'center', padding: '64px 32px', color: 'var(--col-ink-muted)' }}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ marginBottom: 16, opacity: 0.4 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    </svg>
    <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--col-ink)' }}>{message}</p>
    {sub && <p style={{ fontSize: '0.875rem', marginTop: 8 }}>{sub}</p>}
  </div>
);

export const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 4 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i}>
        <div style={{ height: 16, background: 'var(--col-border)', borderRadius: 4, animation: 'pulse-ring 1.5s ease-in-out infinite' }} />
      </td>
    ))}
  </tr>
);
