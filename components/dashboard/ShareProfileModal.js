'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, ExternalLink, QrCode, Download, Share2, Mail } from 'lucide-react';
import { APP_DOMAIN } from '../../lib/constants';
import SocialIcon from '../ui/SocialIcon';
import { setQuestFlag } from '../../lib/questFlags';

function drawSafeRoundRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

export default function ShareProfileModal({ profile, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const username = profile?.username || '';
  const displayName = profile?.display_name || username || 'My Page';

  const pageUrl = typeof window !== 'undefined' && username
    ? `${window.location.origin}/${username}`
    : username
      ? `https://${APP_DOMAIN}/${username}`
      : '';

  const displayUrl = username ? `${APP_DOMAIN}/${username}` : APP_DOMAIN;
  const qrUrl = username
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&ecc=H&data=${encodeURIComponent(pageUrl)}`
    : '';

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = useCallback(() => {
    if (!pageUrl) return;
    navigator.clipboard.writeText(pageUrl).then(() => {
      setCopied(true);
      setQuestFlag('shared_page');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [pageUrl]);

  const handleNativeShare = useCallback(async () => {
    if (!pageUrl) return;
    try {
      await navigator.share({
        title: `${displayName} on Link-in-Bio`,
        text: `Check out my links and profile on ${APP_DOMAIN}:`,
        url: pageUrl,
      });
      setQuestFlag('shared_page');
    } catch (err) {
      if (err.name !== 'AbortError') {
        handleCopy();
      }
    }
  }, [displayName, pageUrl, handleCopy]);

  const handleChannelShare = (channel) => {
    if (!pageUrl) return;
    setQuestFlag('shared_page');
    const text = encodeURIComponent(`Check out my links and profile: ${displayName}`);
    const url = encodeURIComponent(pageUrl);

    let target = '';
    switch (channel) {
      case 'whatsapp':
        target = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        break;
      case 'twitter':
        target = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        target = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'linkedin':
        target = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'telegram':
        target = `https://t.me/share/url?url=${url}&text=${text}`;
        break;
      case 'email':
        target = `mailto:?subject=${encodeURIComponent(`${displayName}'s Profile`)}&body=${text}%0A%0A${url}`;
        break;
      default:
        break;
    }

    if (target) {
      window.open(target, '_blank', 'noopener,noreferrer,width=600,height=500');
    }
  };

  const downloadQrWithBadge = async () => {
    if (!pageUrl || !qrUrl) return;
    setQuestFlag('shared_page');
    setIsDownloadingQr(true);
    const filename = `${username || 'profile'}-qr-code.png`;
    const highResQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=16&ecc=H&data=${encodeURIComponent(pageUrl)}`;

    try {
      await new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const size = 600;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);

            // Centered dark badge with rounded corners and official app logo
            const badgeSize = Math.round(size * 0.18);
            const badgeX = (size - badgeSize) / 2;
            const badgeY = (size - badgeSize) / 2;
            const radius = Math.round(badgeSize * 0.22);

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            drawSafeRoundRect(ctx, badgeX, badgeY, badgeSize, badgeSize, radius);
            ctx.fill();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 6;
            ctx.stroke();

            const iconSize = Math.round(badgeSize * 0.54);
            const scale = iconSize / 24;
            const offsetX = badgeX + (badgeSize - iconSize) / 2;
            const offsetY = badgeY + (badgeSize - iconSize) / 2;

            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (typeof Path2D !== 'undefined') {
              ctx.stroke(new Path2D("M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"));
              ctx.stroke(new Path2D("M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"));
            } else {
              ctx.beginPath();
              ctx.arc(14.5, 9.5, 4.5, 0.75 * Math.PI, 1.75 * Math.PI);
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(9.5, 14.5, 4.5, 1.75 * Math.PI, 0.75 * Math.PI);
              ctx.stroke();
            }
            ctx.restore();

            canvas.toBlob((blob) => {
              if (blob) {
                const objectUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = objectUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                  document.body.removeChild(link);
                  URL.revokeObjectURL(objectUrl);
                }, 1000);
                resolve();
              } else {
                reject(new Error('Canvas blob failed'));
              }
            }, 'image/png');
          } catch (canvasErr) {
            reject(canvasErr);
          }
        };

        img.onerror = () => reject(new Error('External QR image failed to load'));
        img.src = highResQrUrl;
      });
    } catch (err) {
      console.warn('QR canvas download failed, falling back to direct link:', err);
      window.open(highResQrUrl, '_blank');
    } finally {
      setIsDownloadingQr(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-profile-in">
      <div
        className="relative w-full max-w-md rounded-2xl sm:rounded-[24px] border border-zinc-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5 text-black max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-xs">
              <Share2 size={15} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-black">Share your page</h3>
              <p className="text-[11px] text-zinc-400">Share your live link-in-bio across platforms</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-black transition"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Link URL Box */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Your Live Link</span>
            {username && (
              <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-bold text-black hover:underline"
              >
                <span>Visit page</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 rounded-[8px] border border-zinc-200 bg-white px-3 py-2 font-mono text-xs font-semibold text-zinc-800 truncate select-all">
              {displayUrl}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`flex shrink-0 items-center justify-center gap-1.5 rounded-[8px] px-3.5 py-2 text-xs font-bold transition shadow-xs active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-black text-white hover:bg-zinc-800'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Native Mobile Share Button */}
        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95"
          >
            <Share2 size={14} />
            <span>Share via device apps...</span>
          </button>
        )}

        {/* Quick Social Channels */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Quick Share</span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => handleChannelShare('whatsapp')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-zinc-50 transition group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xs group-hover:scale-105 transition">
                <SocialIcon name="whatsapp" className="text-[18px]" />
              </div>
              <span className="text-[10px] font-bold text-zinc-600">WhatsApp</span>
            </button>

            {/* X / Twitter */}
            <button
              type="button"
              onClick={() => handleChannelShare('twitter')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-zinc-50 transition group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-xs group-hover:scale-105 transition">
                <SocialIcon name="twitter" className="text-[16px]" />
              </div>
              <span className="text-[10px] font-bold text-zinc-600">X</span>
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={() => handleChannelShare('telegram')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-zinc-50 transition group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#24A1DE] text-white shadow-xs group-hover:scale-105 transition">
                <SocialIcon name="telegram" className="text-[17px]" />
              </div>
              <span className="text-[10px] font-bold text-zinc-600">Telegram</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleChannelShare('facebook')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-zinc-50 transition group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-xs group-hover:scale-105 transition">
                <SocialIcon name="facebook" className="text-[17px]" />
              </div>
              <span className="text-[10px] font-bold text-zinc-600">Facebook</span>
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              onClick={() => handleChannelShare('linkedin')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-zinc-50 transition group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-xs group-hover:scale-105 transition">
                <SocialIcon name="linkedin" className="text-[16px]" />
              </div>
              <span className="text-[10px] font-bold text-zinc-600">LinkedIn</span>
            </button>

            {/* Email */}
            <button
              type="button"
              onClick={() => handleChannelShare('email')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-zinc-50 transition group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-white shadow-xs group-hover:scale-105 transition">
                <Mail size={16} />
              </div>
              <span className="text-[10px] font-bold text-zinc-600">Email</span>
            </button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="border-t border-zinc-100 pt-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-black transition"
            >
              <QrCode size={14} className="text-zinc-500" />
              <span>{showQr ? 'Hide QR Code' : 'Show Scannable QR Code'}</span>
            </button>
            {showQr && (
              <button
                type="button"
                onClick={downloadQrWithBadge}
                disabled={isDownloadingQr}
                className="flex items-center gap-1 text-xs font-bold text-black hover:underline disabled:opacity-50"
              >
                <Download size={12} />
                <span>{isDownloadingQr ? 'Saving...' : 'Download PNG'}</span>
              </button>
            )}
          </div>

          {showQr && (
            <div className="mt-3 flex flex-col items-center rounded-xl bg-zinc-50 p-4 border border-zinc-200">
              <div className="relative overflow-hidden rounded-2xl border-2 border-black bg-black p-3 shadow-md">
                <img
                  src={qrUrl}
                  alt={`QR code for ${pageUrl}`}
                  className="h-36 w-36 rounded-xl object-contain bg-white p-1"
                />
                <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl bg-black border-2 border-white shadow-md p-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-zinc-500 font-medium">
                Scan with any phone camera to visit your profile instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
