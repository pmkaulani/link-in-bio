# Security Policy & Architecture

Link-in-Bio is committed to safeguarding creator data, visitor privacy, and application integrity.

---

## 1. Security Architecture & Controls

### Row Level Security (RLS)
- Every Postgres table enforces RLS.
- Anonymous visitors can strictly only query `is_visible = true` and `is_disabled = false` blocks on `published` or `unlisted` profiles.
- Authenticated creators can strictly only mutate rows matching their user ID (`auth.uid() = profile_id`).
- Administrative operations, audit log writes, and account purges are conducted through request-scoped admin clients using the server-side service role key.

### Input Sanitization & SSRF Defense
- All URLs are validated server-side against an allowlist of schemes (`https:`, `http:`, `mailto:`, `tel:`). Dangerous schemes (`javascript:`, `data:`, `vbscript:`, `file:`, `blob:`) are strictly stripped.
- SSRF filtering blocks requests to private/internal subnets (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).
- Third-party media embeds are restricted to approved providers (`youtube.com`, `vimeo.com`, `spotify.com`).

### Security Headers & Content Security Policy
- `Content-Security-Policy`: Restricts script execution, styles, connect domains, and enforces `frame-ancestors 'none'`.
- `Strict-Transport-Security`: Enforces 2-year HSTS with preload (`max-age=63072000; includeSubDomains; preload`).
- `X-Content-Type-Options`: `nosniff`.
- `X-Frame-Options`: `DENY`.
- `Referrer-Policy`: `strict-origin-when-cross-origin`.

---

## 2. Reporting a Security Vulnerability

If you discover a security vulnerability within Link-in-Bio, please report it directly to our security team rather than opening a public issue.

- **Email**: [pmkaulani@gmail.com](mailto:pmkaulani@gmail.com)
- **Response SLA**: Within 24 hours.

Please include:
1. Detailed description of the vulnerability.
2. Steps or proof-of-concept to reproduce the behavior.
3. Impact assessment and suggested remediation if known.
