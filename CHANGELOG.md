# Changelog

## Unreleased

- Added click/view analytics: every public page view and link click is logged (`analytics_events` table), with a new Analytics dashboard tab showing totals, CTR, a 14-day view trend, and a per-link click breakdown.
- Added custom domain support: a Domain tab walks through TXT/CNAME setup and does real DNS-over-HTTPS verification; `middleware.js` resolves a verified domain's traffic to the right public page. The actual SSL/hosting-side domain attachment (e.g. adding it in Vercel) still has to happen outside this codebase — see the in-app instructions and the README.
- Added a "Grid" block (Instagram/TikTok-style post grid): add posts manually (thumbnail + link), or sync real posts from Instagram via a self-supplied Graph API access token — the token is used once and never stored. No equivalent quick-sync exists for TikTok (their API requires a full registered app), so TikTok grids are manual-entry only for now.
- Added per-link thumbnail images (a real thumbnail slot, separate from block background — matches Linktree/Beacons' link thumbnails) with icon fallback when unset.
- Added scheduling (show from / show until dates) to every block type except divider/spacer — a block outside its window is automatically hidden on the public page, with a badge in the dashboard so owners know why.
- Added a "Share your page" card on the Profile tab: QR code (via api.qrserver.com), copy-link, and QR download — common across Linktree, Beacons, and Flowpage's free tiers.
- Added "Sign in with Google" (OAuth via Supabase), with auto-created profiles on first
  sign-in and an editable username step in onboarding.
- Added a 4-step onboarding wizard shown after signup (profile basics, starter theme,
  quick-add social links, done).
- Added a "Quick add" row of common social platforms to the Blocks tab for faster link
  creation.
- Added bulk "apply to all links" controls for entrance/hover animation on the Theme page.
- Redesigned the dashboard, login, and signup pages with a consistent brand token system
  (`tailwind.config.js` `brand-*` scale, `shadow-card` / `shadow-pop`).
- Visual font picker (live preview per option) replacing the plain `<select>`.
- Security fix: link and social URLs are now scheme-validated (`http:`/`https:`/`mailto:`/
  `tel:` only) before being used as `href`, closing a stored-XSS path via `javascript:` URLs.
- Accessibility fix: block drag handle is keyboard-focusable again (was accidentally
  `tabIndex={-1}`, which silently broke the `@dnd-kit` `KeyboardSensor`); icon-only buttons
  in the block list now have `aria-label`s.
- Added `/terms` and `/privacy` pages.

## v2 — Personalization build

- Per-link entrance animation, hover animation, and per-link background (transparent,
  solid, gradient, image URL).
- Interactive cursor/radial background lighting on the public page.
- Profile font selection, accent/text colors, background presets, adjustable button
  roundness.
- Social icons on the public page.
- Responsive public profile, reduced-motion support.
- Migrated from a fixed link list to the block model (link, heading, text, image, video,
  divider, spacer) with drag-and-drop reordering, replacing the earlier up/down-button
  reordering and single `links` table.

## v1 — Initial clone

- Email/password auth, public profile at `/username`, basic link list with icon picker,
  three fixed theme components.
