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
