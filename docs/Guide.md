# Dynamic Wallet View – Guide

## Quick Start

1. Install dependencies:
   - npm install
2. Development:
   - npm run dev
3. Build:
   - npm run build && npm run start

## App Structure

- Routes:
  - /login → login flow
  - /dashboard → main dashboard
  - /dashboard/team → team page
  - /dashboard/transactions → transactions
  - /dashboard/settings → profile/settings

- Shell & Theme:
  - src/app/globals.css (palette)
  - tailwind.config.ts

- Auth & Session:
  - src/contexts/AuthContext.tsx
  - src/app/api/user/me/route.ts

## Conventions

- Use ViewportProvider (no use-mobile hook).
- Prefer DB-backed endpoints; mocks allowed only in development.
- Replace console.* with lib/log helpers over time.

## Deployment Notes

- Ensure Prisma generated (npx prisma generate) when schema changes.
- Avoid tracking JSON with Git LFS.
