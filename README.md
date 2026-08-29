# Link-in-Bio Platform (V3 Architecture Specification)

A full-stack, multi-user link-in-bio platform with a visual builder, rich content blocks, per-link customization, comprehensive creator analytics, a **Superadmin Command Center**, and a **Trust & Safety Moderation System**.

---

## System Architecture

```
                                  LINK-IN-BIO PLATFORM
                                           │
                ┌──────────────────────────┴──────────────────────────┐
                │                                                     │
         CREATOR DASHBOARD                                    SUPERADMIN CONTROL
                │                                                     │
     ┌──────────┼──────────┐                               ┌──────────┼──────────┐
     │          │          │                               │          │          │
  Visual      Theme &    Traffic                         User       Reports    URL Safety &
  Blocks      Motion   Analytics                      Management     Queue      Moderation
     │          │          │                               │          │          │
     └──────────┼──────────┘                               └──────────┼──────────┘
                │                                                     │
                ▼                                                     ▼
        PUBLIC LINK PAGE                                      PLATFORM AUDIT & FLAGS
  (Live Snapshot, Fast & Safe)                        (Feature Toggles, Blacklist, Logs)
```

---

## Key Feature Sets

### 1. Visual Editor & Live Preview
- **2-Way Interactive Preview**: Click any element inside the mobile phone preview to focus and open its editor in the left panel.
- **Rich Content Blocks**: Links, Section Headings, Paragraph Text, Announcement Callouts, Images, Video Embeds (YouTube/Vimeo), Multi-post Grids, Dividers, and Spacers.
- **Per-Link Design Overrides**: Individual link colors, custom card backgrounds (solid, gradient, transparent, image), entrance animations, hover micro-interactions, and scheduling.
- **Draft & Publish Workflow**: Changes are previewed in real-time and published to public visitors on demand.
- **Reliable Save Lifecycle**: Instant UI updates with snapshot rollback and automatic error reconciliation on network failure.

### 2. Superadmin Command Center (`/admin`)
- **Platform Analytics & Health**: Track total users, active creators, suspended accounts, pending reports, total pageviews/clicks, and real-time subsystem latency.
- **User Moderation**: Global search across usernames, emails, and IDs. Manage account status (`active`, `warning`, `suspended`, `banned`) and grant official verification badges.
- **Trust & Safety Reports Queue**: Real-time moderation intake. Review reported phishing links, harmful content, or impersonation. Take one-click actions: *Disable Targeted Link*, *Suspend Account*, or *Resolve with Notes*.
- **URL Safety & Content Moderation**: Inspect destination domains and disable malicious links without deleting the user's entire profile.
- **Reserved Usernames Blacklist**: Guard against staff or system impersonation (e.g. `admin`, `support`, `security`, `official`, `billing`).
- **Feature Flags & Settings**: Toggle platform features live (`user_registration`, `public_pages`, `advanced_analytics`, `custom_domains`, `experimental_themes`) and set global limits.
- **Immutable Audit Trail**: Chronological log of all administrator actions.

### 3. Truthful Identity & Verification
- **Verified Badges**: Real verification checkmarks granted strictly via administrator review (`is_verified` database flag).
- **"About this account" Metadata**: Displays authentic account creation date and connected profile links without fabricated claims.

### 4. Advanced Analytics
- **Metrics**: Total Page Views, Unique Visitors, Total Link Clicks, and Click-Through Rate (CTR).
- **14-Day View Trends**: Daily bar chart visualization.
- **Traffic Referrers**: Automatic channel detection (Instagram, TikTok, WhatsApp, X/Twitter, Google, Direct).
- **Device Breakdown**: Mobile, Desktop, and Tablet distribution.
- **Per-Link Performance**: Click distribution per link card.

### 5. Categorized Themes & Motion Settings
- **Subtle (Default)**: Clean minimalist palettes, tactile film grain, and gentle ambient aurora waves.
- **Dynamic**: Ambient floating orbs, dot matrix grids, and blueprint meshes.
- **Experimental**: Laser beams, cyberpunk matrix, and holographic liquid chrome.
- **Motion Accessibility**: Visitor motion preferences (`auto`, `reduced`, `active`).

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom design tokens
- **Drag & Drop**: `@dnd-kit/core` and `@dnd-kit/sortable`
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security)
- **Local Demo Sandbox**: Built-in client-side database mock for instant zero-config testing

---

## Getting Started

### 1. Local Development (Zero-Config Demo Mode)

Run the development server out of the box. If Supabase environment variables are omitted, the app runs in local sandbox mode with full Superadmin and Creator capabilities:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

- **Creator Dashboard**: `http://localhost:3000/dashboard`
- **Superadmin Control Center**: `http://localhost:3000/admin`
- **Public Profile Example**: `http://localhost:3000/localuser` or `http://localhost:3000/sarah`

### 2. Production Database Setup (Supabase)

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run `supabase/schema.sql`.
3. Copy `.env.local.example` to `.env.local` and add your project credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Grant administrator access to your user in the `platform_admins` table:

```sql
INSERT INTO platform_admins (user_id, role)
VALUES ('your-supabase-auth-user-id', 'superadmin');
```

---

## Database Schema Overview

| Table | Purpose |
|---|---|
| `profiles` | User profiles, themes, styling, verification flag, account status |
| `blocks` | Content blocks (link, heading, text, callout, image, video, grid, divider, spacer) |
| `platform_admins` | Server-verified administrator accounts and roles |
| `reports` | Trust & Safety incoming visitor moderation reports and resolutions |
| `reserved_usernames` | Blacklist of reserved system and brand handles |
| `admin_audit_logs` | Audit trail of all administrative actions |
| `feature_flags` | Dynamic platform feature toggles |
| `platform_settings` | Global platform parameters and limits |
| `analytics_events` | Pageviews and link clicks with referrer and device metadata |
| `custom_domains` | Custom domain mapping records |

---

## Running Tests

Execute the Node.js test suite:

```bash
npm test
```
"# link-in-bio" 
