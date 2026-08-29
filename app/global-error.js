'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Critical root layout error:', error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Critical Application Error — LinkBio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0b0f17', color: '#f4f4f5', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '440px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '36px 24px', backdropFilter: 'blur(16px)', boxSizing: 'border-box' }}>
            <div style={{ width: '48px', height: '48px', margin: '0 auto 20px', borderRadius: '14px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
              !
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px', color: '#ffffff' }}>
              Critical Application Error
            </h1>
            <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 24px', lineHeight: '1.5' }}>
              The application encountered an unexpected failure in the root layout.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => reset()}
                style={{ cursor: 'pointer', padding: '10px 20px', background: '#0E7A46', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '600', transition: 'background 0.2s' }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', padding: '10px 20px', background: 'rgba(255,255,255,0.08)', color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px', fontWeight: '500' }}
              >
                Reload Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
