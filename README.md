# Global South Watch

**Online magazine & news portal** covering Africa and the Global South.  
Independent journalism, a modern editorial interface, an integrated back office, and a full reader experience (accounts, premium paywall, multimedia).

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Data seeding](#data-seeding)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Authentication & roles](#authentication--roles)
- [REST API](#rest-api)
- [Design system](#design-system)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

Global South Watch is a **full-stack** application built with **Next.js 16** (App Router). It combines:

- a rich **magazine homepage** (breaking ticker, hero lead, editor's choice, latest news, opinion, thematic sections, video, stats & newsletter);
- **article pages** with paywall, comments, and social sharing;
- an **admin workspace** for the editorial team;
- an **API layer** for search, newsletter, RSS, and reader interactions.

When MongoDB is not configured, the app automatically falls back to **built-in demo data** — useful for exploring the UI immediately.

---

## Features

### Reader-facing

| Module | Description |
|--------|-------------|
| **Homepage** | Masthead, breaking ticker, hero lead, editor's choice, latest news, opinion columns, thematic bands, video section, stats & newsletter |
| **Articles** | Rich HTML content, gallery, video, podcast, reading progress, related articles |
| **Categories** | Category pages with featured article and article grid (`/category/[slug]`) |
| **Search** | Full-text search across published articles |
| **Breaking** | Dedicated urgent / breaking news page (`/urgent`) |
| **Multimedia** | Hubs at `/videos` and `/podcasts` |
| **Account** | Registration, login (email or Google), profile, reading history, saved articles |
| **Premium** | Paywall on exclusive `isPremium` articles; premium status managed per user |
| **Institutional** | About, team, editorial charter, contact, legal, privacy, accessibility, and more |

### Editorial (`/admin`)

- Dashboard (articles, users, comments, newsletter)
- Article management (create, edit, workflow: draft → review → published)
- Editorial review queue (`/admin/review`)
- Comment moderation
- Category and author management
- Breaking alerts and homepage section curation
- Site settings, branding upload, and user / premium management

### SEO & distribution

- `sitemap.xml` and `robots.txt` generated via App Router metadata routes
- RSS feed at `/api/feed`
- Open Graph metadata per article

---

## Tech stack

| Layer | Technologies |
|-------|--------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, RSC, caching) |
| **UI** | React 19, custom CSS design system (“Revolution Edition”), Tailwind CSS 4 |
| **Database** | [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) |
| **Auth** | [NextAuth.js v5](https://authjs.dev/) (Credentials + Google OAuth) |
| **Forms** | React Hook Form + Zod |
| **Editor** | TipTap (admin back office) |
| **Utilities** | date-fns, slugify, bcryptjs, lucide-react, recharts |

---

## Architecture

```mermaid
flowchart TB
  subgraph client [Client]
    Pages[App Router pages]
    Components[UI components]
  end

  subgraph server [Next.js server]
    RSC[Server Components]
    API[Route Handlers /api]
    Auth[NextAuth]
    Data[data.ts + map-home-data]
  end

  subgraph persistence [Persistence]
    MongoDB[(MongoDB Atlas / local)]
  end

  Pages --> RSC
  RSC --> Data
  Data --> MongoDB
  API --> MongoDB
  Auth --> MongoDB
  Data -.->|fallback| Mock[mock-data.ts]
```

**Homepage data flow:**

1. `getHomePageData()` queries MongoDB (or falls back to mock data).
2. `mapHomePageData()` transforms documents into typed UI sections.
3. `site-chrome/*` components render each editorial band.

**Category URLs** use English slugs (`news`, `politics`, `technology`, `health`, `world`, `special-reports`, etc.). Legacy French slugs (e.g. `actualites`, `politique`) are redirected to their English equivalents via `next.config.ts` and `src/lib/category-slugs.ts`.

---

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- **MongoDB**: local instance or a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- *(Optional)* Google Cloud project for OAuth (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)
- *(Optional)* Licensed **Canela** webfont files or an Adobe Fonts kit ID for production typography

---

## Installation

```bash
# 1. Clone the repository
git clone <repo-url> magasine
cd magasine

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Configuration

Create a `.env.local` file at the project root (see `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Recommended | MongoDB connection URI. Without it, demo mode is enabled |
| `NEXTAUTH_URL` | Yes | Public app URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | JWT secret — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID` | No | Adobe Fonts kit ID for Canela (alternative to self-hosted files) |

> **Security:** never commit `.env.local`. Use strong, unique secrets in production.

### Remote images

Allowed domains for `next/image` are configured in `next.config.ts`:

- `images.unsplash.com` (editorial imagery)
- `api.dicebear.com` (author avatars)

To add a CDN or S3 bucket, extend `images.remotePatterns`.

### Canela font files

Place licensed `.woff2` files in `public/fonts/canela/` (see `src/app/fonts/canela.css` for expected filenames), or set `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID` to load Canela from Adobe Fonts.

---

## Data seeding

Once MongoDB is configured and the server is running:

```bash
# First-time initialization (categories, authors, ~50 articles, alerts, admin)
curl http://localhost:3000/api/seed

# Full reset (wipes existing data — requires super_admin session)
curl "http://localhost:3000/api/seed?force=true"
```

Or via npm (server must already be running):

```bash
npm run seed
```

**Administrator account created by the seed:**

| Field | Value |
|-------|--------|
| Email | `admin@globalsouthwatch.com` |
| Password | `Admin123!` |

> Change this password immediately in production.

**Development shortcut:** in `NODE_ENV=development`, `GET /api/dev/ensure-admin` creates or repairs the default admin account without re-seeding the database.

---

## Available scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Production server (after `build`) |
| `npm run lint` | ESLint analysis |
| `npm run seed` | Calls `/api/seed` (requires `dev` or `start` to be running) |

---

## Project structure

```
magasine/
├── public/
│   ├── fonts/canela/        # Licensed Canela webfont files (optional)
│   └── images/              # Logo, press partners
├── src/
│   ├── app/                 # App Router routes
│   │   ├── api/             # REST Route Handlers
│   │   ├── admin/           # Editorial back office
│   │   ├── article/         # Article pages
│   │   ├── category/        # Category pages
│   │   ├── author/          # Author pages
│   │   ├── fonts/           # Canela @font-face declarations
│   │   ├── globals.css      # Design tokens & base styles
│   │   ├── responsive.css   # Mobile breakpoints
│   │   └── revolution.css   # “Revolution Edition” theme
│   ├── components/
│   │   ├── site-chrome/   # Homepage & site chrome
│   │   ├── article/         # Article detail, paywall, comments
│   │   ├── admin/           # Back-office components
│   │   └── ui/              # Shared primitives
│   ├── data/                # Static data (nav, partners)
│   ├── lib/
│   │   ├── data.ts          # Data access layer (DB + fallback)
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── category-slugs.ts # English slugs & legacy redirects
│   │   ├── seed-data.ts     # Demo / seed dataset
│   │   └── mongodb.ts       # Mongoose connection (global cache)
│   ├── models/              # Mongoose schemas
│   ├── proxy.ts             # Admin route protection (Next.js 16)
│   └── types/               # Shared TypeScript types
├── .env.example
├── next.config.ts
└── package.json
```

---

## Authentication & roles

Access to `/admin` is protected by a **proxy** (`src/proxy.ts`, Next.js 16 convention). Unauthenticated users are redirected to `/login`; users without an editorial role are sent to the homepage.

| Role | Admin access | Typical permissions |
|------|--------------|-------------------|
| `super_admin` | Yes | Full access; only role that can force-reseed or assign `super_admin` |
| `admin` | Yes | Full editorial and user management |
| `editor` | Yes | Articles, comments, alerts |
| `author` | Yes | Own content |
| `contributor` | No | Submission workflow (review queue) |
| `reader` | No | Reading, comments, saved articles |

**Login:** `/login` — email/password or Google (when configured).

**Paywall:** articles marked `isPremium` are accessible to users with `isPremium: true`, article authors, and admin/editorial roles.

---

## REST API

### Public & reader

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/seed` | GET | Initialize database (`?force=true` resets; requires `super_admin`) |
| `/api/search` | GET | Article search (`?q=`) |
| `/api/feed` | GET | RSS feed |
| `/api/newsletter` | GET, POST, PATCH | Newsletter subscription management |
| `/api/register` | POST | Reader account registration |
| `/api/comments` | GET, POST | Comments by article |
| `/api/contact` | POST | Contact form |
| `/api/donate` | POST | Donation form submission |
| `/api/user/profile` | GET | Authenticated user profile |
| `/api/user/saved` | POST | Save / unsave an article |
| `/api/user/history` | POST | Record reading history |
| `/api/auth/[...nextauth]` | * | NextAuth handlers |

### Admin (authenticated, editorial role)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/articles` | POST | Create article |
| `/api/admin/articles/[id]` | GET, PATCH, DELETE | Article CRUD |
| `/api/admin/comments` | GET, PATCH | Comment moderation |
| `/api/admin/categories` | GET, POST | List / create categories |
| `/api/admin/categories/[id]` | PATCH, DELETE | Update / delete category |
| `/api/admin/authors` | GET, POST | List / create authors |
| `/api/admin/authors/[id]` | PATCH, DELETE | Update / delete author |
| `/api/admin/alerts` | GET, POST | Breaking ticker alerts |
| `/api/admin/alerts/[id]` | PATCH, DELETE | Update / delete alert |
| `/api/admin/users` | GET, PATCH | User roles and premium flags |
| `/api/admin/homepage` | GET, PATCH | Homepage section configuration |
| `/api/admin/settings` | GET, PATCH | Site settings |
| `/api/admin/branding/upload` | GET, POST | Logo / favicon upload |
| `/api/admin/meta` | GET | Dashboard statistics |
| `/api/admin/newsletter/export` | GET | Export subscriber list |

### Development only

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dev/ensure-admin` | GET | Create or repair the default admin account |

---

## Design system

Visual identity aligned with the Global South Watch logo:

| Token | Value | Usage |
|-------|--------|-------|
| `--brand-blue` | `#1a3896` | Primary, tags, CTAs |
| `--brand-brown` | `#94563c` | Accent, live badges |
| `--cream` / `--white` | Light backgrounds | Light theme only |

**Typography:**

| Font | Role | Source |
|------|------|--------|
| **Canela** | Editorial — headlines, body copy, display type | `public/fonts/canela/` or Adobe Fonts (`NEXT_PUBLIC_ADOBE_FONTS_KIT_ID`) |
| **DM Sans** | UI — navigation, forms, buttons, labels | Google Fonts via `next/font` (`--font-dm-sans`) |

CSS custom properties: `--f-editorial`, `--f-display`, and `--f-body` map to Canela; `--f-ui` maps to DM Sans.

The **Revolution Edition** theme (`revolution.css`) adds glassmorphism, scroll-reveal animations, and a bento-style homepage layout.

**Primary category slugs** (English, canonical):

| Slug | Topic |
|------|-------|
| `news` | National and regional news |
| `politics` | Governance, elections, institutions |
| `technology` | Innovation, digital infrastructure, startups |
| `health` | Public health and health systems |
| `world` | International coverage |
| `special-reports` | Long-form and cross-border features |

Additional seeded categories include `culture`, `investigations`, `opinion`, `multimedia`, `local`, `africa`, `latin-america`, `south-asia`, and `west-asia`.

---

## Deployment

### Production build

```bash
npm run build
npm run start
```

### Production environment variables

- `NEXTAUTH_URL` → final HTTPS domain URL
- `NEXTAUTH_SECRET` → unique, long random secret
- `MONGODB_URI` → production cluster (IP allowlist / VPC)
- `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID` → optional, for licensed Canela in production

### Recommended platforms

- [Vercel](https://vercel.com/) — native Next.js deployment
- [Render](https://render.com/) — Node.js web service
- MongoDB Atlas — managed database

### Pre-launch checklist

- [ ] Change the seeded admin password
- [ ] Set `metadataBase` in `layout.tsx` (canonical OG URL)
- [ ] Verify `remotePatterns` for your image CDN
- [ ] Enable HTTPS and secure NextAuth cookies
- [ ] Restrict or disable `/api/seed` in production
- [ ] Install licensed Canela font files or configure Adobe Fonts

---

## Troubleshooting

### Images not loading

- Confirm the image URL is listed in `remotePatterns` (`next.config.ts`)
- Invalid Unsplash URLs are repaired at runtime via `resolveFeaturedImage()` in `src/lib/images.ts`
- The local logo must exist at `public/images/logo-global-south-watch.png`

### MongoDB / seed errors

- Check `MONGODB_URI` for stray spaces in the database name
- Atlas free tier: 500-collection limit — remove unused test databases
- Without MongoDB: the app runs in automatic mock mode

### Admin access denied

- Sign in with a account whose role is `admin`, `editor`, `author`, or `super_admin`
- Run `/api/seed` or `/api/dev/ensure-admin` (development) if no admin user exists

### Canela font not rendering

- Add `.woff2` files to `public/fonts/canela/`, or set `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID`
- Without Canela, the stack falls back to Georgia / Times New Roman

### `npm run seed` fails on Windows

Use PowerShell:

```powershell
Invoke-WebRequest http://localhost:3000/api/seed
```

---

## License

Private project — all rights reserved.  
Editorial contact: [contact@globalsouthwatch.com](mailto:contact@globalsouthwatch.com)

---

**Global South Watch** — Journalism at the heart of the Global South
