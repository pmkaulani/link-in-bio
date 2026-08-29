# Production Deployment Guide

This guide walks you through deploying the Link-in-Bio platform across **GitHub**, **Supabase**, and **Vercel**.

---

## Step 1: Push Repository to GitHub

1. Open your terminal in the project directory.
2. Initialize and commit:
   ```bash
   git init
   git add .
   git commit -m "Production release v1.0.0"
   git branch -M main
   ```
3. Link to your GitHub repository and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/link-in-bio.git
   git push -u origin main
   ```

---

## Step 2: Set Up Supabase Production Project

1. Go to [supabase.com](https://supabase.com) and create a new project (e.g. `link-in-bio-production`).
2. Open the **SQL Editor** tab.
3. Run migration `supabase/migrations/001_initial_schema.sql`.
4. Run migration `supabase/migrations/002_production_hardening.sql`.
5. Under **Authentication -> URL Configuration**:
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**:
     - `http://localhost:3000/**`
     - `https://your-domain.com/**`
     - `https://*.vercel.app/**`
6. Under **Authentication -> Providers**:
   - Enable **Google**, **GitHub**, and **LinkedIn** and supply your Client ID and Client Secret for each.
7. Go to **Project Settings -> API** and copy:
   - `Project URL`
   - `anon` public key
   - `service_role` secret key

---

## Step 3: Deploy to Vercel

1. Log into [vercel.com](https://vercel.com) and click **Add New -> Project**.
2. Import your GitHub repository (`link-in-bio`).
3. Under **Environment Variables**, add:

   | Key | Value / Source |
   | :--- | :--- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase `anon` key |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase `anon` key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase `service_role` key |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` |
   | `NEXT_PUBLIC_APP_HOST` | `your-domain.com` |
   | `SUPPORT_EMAIL` | `pmkaulani@gmail.com` |
   | `SECURITY_EMAIL` | `pmkaulani@gmail.com` |
   | `PRIVACY_EMAIL` | `pmkaulani@gmail.com` |
   | `LEGAL_EMAIL` | `pmkaulani@gmail.com` |

4. Click **Deploy**.

---

## Step 4: Configure Custom Domain & DNS

1. In Vercel, navigate to **Project Settings -> Domains**.
2. Add your domain (e.g. `your-domain.com` and `www.your-domain.com`).
3. In your DNS provider (Cloudflare, Namecheap, GoDaddy, etc.), add:
   - **A Record**: `@` -> `76.76.21.21`
   - **CNAME Record**: `www` -> `cname.vercel-dns.com`
4. Wait for SSL certificate issuance (typically 1–5 minutes).

---

## Step 5: Post-Deployment Smoke Test

- [ ] Visit `https://your-domain.com/` (Home page loads cleanly).
- [ ] Visit `https://your-domain.com/api/health` (Returns `{ status: "ok", mode: "connected" }`).
- [ ] Sign up a new user via email and via Google OAuth.
- [ ] Create a link block and publish the page.
- [ ] Open the creator link in an incognito window: verify published content loads and unlisted/draft items are hidden.
- [ ] Test reporting a link: verify report appears in the admin dashboard at `/admin/reports`.
