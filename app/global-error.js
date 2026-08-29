'use client';

import { useEffect } from 'react';
import { APP_DOMAIN } from '../lib/constants';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Critical root layout error:', error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Application Error — Link in Bio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#000000', color: '#f4f4f5', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '440px', width: '100%', border: '1px solid #27272a', background: '#09090b', borderRadius: '16px', padding: '36px 28px', boxSizing: 'border-box' }}>
            <div style={{ width: '48px', height: '48px', margin: '0 auto 20px', borderRadius: '12px', background: '#18181b', border: '1px solid #27272a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
              !
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px', color: '#ffffff', letterSpacing: '-0.025em' }}>
              System Interruption
            </h1>
            <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 24px', lineHeight: '1.5' }}>
              The application encountered an unexpected runtime failure.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => reset()}
                style={{ cursor: 'pointer', padding: '10px 20px', background: '#ffffff', color: '#000000', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', padding: '10px 20px', background: '#18181b', color: '#e4e4e7', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
