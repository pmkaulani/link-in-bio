/**
 * Platform constants and centralized communication channels.
 * Public contact, security, privacy, and legal communications default to pmkaulani@gmail.com.
 */

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'pmkaulani@gmail.com';
export const SECURITY_EMAIL = process.env.SECURITY_EMAIL || 'pmkaulani@gmail.com';
export const PRIVACY_EMAIL = process.env.PRIVACY_EMAIL || 'pmkaulani@gmail.com';
export const LEGAL_EMAIL = process.env.LEGAL_EMAIL || 'pmkaulani@gmail.com';

export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_HOST || 'my-link-in-bio.vercel.app';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://my-link-in-bio.vercel.app';

export const PLATFORM_NAME = 'LinkBio';
export const DEFAULT_THEME = 'growth';
export const DEFAULT_FONT = 'inter';

export const RESERVED_HANDLES = [
  'admin',
  'administrator',
  'superadmin',
  'support',
  'help',
  'security',
  'official',
  'linkinbio',
  'linkinbio_support',
  'api',
  'auth',
  'billing',
  'root',
  'verify',
  'verified',
  'dashboard',
  'settings',
  'login',
  'signup',
  'privacy',
  'terms',
];
