# VisuaLab MVP

Modern image/media management platform built with Next.js, Supabase (Postgres + Prisma), and Cloudflare R2.

## Quick Start

1. Copy env file
   - Duplicate `.env.example` to `.env` and fill in values
2. Install deps (Windows PowerShell)
   - npm install
3. Run DB migrations
   - npm run prisma:migrate
4. Start dev server
   - npm run dev

## Scripts

- dev: Start Next.js dev server
- build: Build for production
- start: Start production server
- prisma:migrate: Run Prisma migration (dev)

## Notes

- Sharp requires native deps; on Windows use Node LTS
- Ensure Cloudflare R2 bucket exists and credentials are correct

## Bonus Features

### Native AI Image Generation

Configure environment:

- REPLICATE_API_TOKEN=your_token
- AI_PROVIDER=replicate
- REPLICATE_MODEL=black-forest-labs/flux-schnell (or any compatible Replicate model)

Usage:

- Sign in as Admin, open /admin/generator
- Enter prompt, negative prompt, seed, steps, batch, width/height, and optional album
- Start generation, watch logs, abort if needed
- Results save into the gallery with generation metadata and are searchable like other images

### Theme / Palette Editor

- As Admin, open /admin/palette
- Edit CSS variables with live preview; save as named presets
- Import/export palette JSON; contrast checker warns on low contrast (WCAG AA)
