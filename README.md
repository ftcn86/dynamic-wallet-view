# Dynamic Wallet View

This repository contains the code for the **Dynamic Wallet View**, a comprehensive, user-friendly, and engaging dashboard application for Pi Network users with a fully redesigned modern UI.

## Project Overview

**Dynamic Wallet View** provides detailed insights into a user's Pi holdings, mining activity, team performance, and node operations. It is designed with a modern, responsive UI, prioritizing clarity, performance, and a clear path to production integration.

### Core Features

* **Authentication Flow:** Session-backed auth with a clean login screen.
* **Modern App Shell:** Glass/gradient theme, improved responsiveness, and a simplified mobile-first navigation.
* **Dashboard:** KPIs, balance breakdown, charts, team leaderboard, rewards, and more.
* **Team / Transactions / Profile:** Streamlined pages under `/dashboard/*`.

## Getting Started

The application is built with Next.js and uses `npm` for package management.

1. **Install dependencies:**

    ```bash
    npm install
    ```

2. **Run the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

3. **Build:**

    ```bash
    # Ensure Prisma client is generated
    npx prisma generate
    npm run build
    ```

## Key Project Files

* `src/app/`: Contains all the application routes, pages, and layouts, following the Next.js App Router structure.
* `src/components/`: Home to all shared and feature-specific React components.
* `src/contexts/AuthContext.tsx`: Manages global user state and authentication logic.
* `src/services/piService.ts`: The centralized data-fetching layer that abstracts away the data source (currently mock data).
* `docs/CHANGELOG.md`: Changelog of updates and fixes.
* `docs/Guide.md`: Quick guide for setup, development, and deployment.
* `docs/DEBUGGING_RULES.md`: Common debugging/playbook items.
* `docs/ROLLBACK_GUIDE.md`: Minimal rollback checklist.
* `docs/PRD.md`: Product Requirements Document (kept as reference).
* `docs/useful link/`: Curated external links and assets (kept).
