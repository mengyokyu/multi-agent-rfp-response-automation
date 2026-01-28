# Frontend (Next.js)

The Next.js web UI for the multi-agent RFP response automation system.

## Table of contents

- [Promo](#promo)
- [Quickstart](#quickstart)
- [Scripts](#scripts)
- [Backend API proxy](#backend-api-proxy)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Promo

<video controls autoplay muted loop playsinline width="100%" src="./public/promo_video.mp4">
  Your Markdown preview can’t play this video.
  <a href="./public/promo_video.mp4">Open public/promo_video.mp4</a>
</video>

When the dev server is running, you can also open it directly:

- `http://localhost:3000/promo_video.mp4`

## Quickstart

### Prerequisites

- Node.js (recommended: Node 18+)
- npm (this repo includes a `package-lock.json`)

### Install

From this folder:

```bash
npm ci
```

### Run (development)

```bash
npm run dev
```

Next.js will start on `http://localhost:3000`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — build for production
- `npm run start` — run the production build
- `npm run lint` — run ESLint

## Backend API proxy

This frontend is configured to proxy requests that start with `/api` to the backend.

- Configuration: [next.config.mjs](next.config.mjs)
- Rewrite: `/api/:path*` → `http://localhost:8000/:path*`

Example:

- `fetch('/api/health')` (in the browser) forwards to `http://localhost:8000/health`

### Note about lib/api.js

[lib/api.js](lib/api.js) uses relative `/api/...` paths by default. If you need to target a different backend origin,
set `NEXT_PUBLIC_API_BASE_URL` (e.g. `http://localhost:8000`) in [.env.example](.env.example).

## Project structure

- `app/` — Next.js App Router routes/pages
- `components/` — shared UI components
- `contexts/` — React context providers (e.g., auth)
- `hooks/` — shared hooks
- `lib/` — client-side helpers
- `public/` — static assets
- `styles/` — global styles

## Troubleshooting

- **API calls failing**: confirm the backend is running on `http://localhost:8000` and that you’re calling `/api/...` routes (or update [lib/api.js](lib/api.js)).
- **Promo video not playing in preview**: some Markdown previews block media playback. Use the direct file link or run the dev server and open `http://localhost:3000/promo_video.mp4`.
