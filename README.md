# Dynamic Wallet View - v1.0

This repository contains the code for the **Dynamic Wallet View**, a comprehensive, user-friendly, and engaging dashboard application for Pi Network users. This application was built as a frontend prototype using Next.js, React, TypeScript, and ShadCN UI.

## Project Overview

**Dynamic Wallet View** provides detailed insights into a user's Pi holdings, mining activity, team performance, and node operations. It is designed with a modern, responsive UI, prioritizing clarity, performance, and a clear path to production integration.

### Core Features

*   **Authentication Flow:** A mock authentication system that simulates logging in with a Pi Network account, including terms of service acceptance.
*   **Main Dashboard:** A central hub displaying Key Performance Indicators (KPIs) like total balance, mining rate, team status, and node uptime. It also includes detailed cards for balance breakdowns and team activity.
*   **Team Insights:** A detailed view of the user's earning team with sorting, status badges, and management tools like pinging inactive members.
*   **Node Analysis:** A dedicated page for node operators to view performance metrics and history.
*   **Transaction History:** A full ledger of the user's transactions.
*   **Settings:** Comprehensive settings for profile customization, theme selection (light/dark/system), and notification preferences.
*   **Donation Page:** A page to simulate supporting the app's development via Pi.

## Getting Started

The application is built with Next.js and uses `npm` for package management.

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Key Project Files

*   `src/app/`: Contains all the application routes, pages, and layouts, following the Next.js App Router structure.
*   `src/components/`: Home to all shared and feature-specific React components.
*   `src/contexts/AuthContext.tsx`: Manages global user state and authentication logic.
*   `src/services/piService.ts`: The centralized data-fetching layer that abstracts away the data source (currently mock data).
*   `docs/COMPREHENSIVE_DOCUMENTATION.md`: Complete project documentation including setup, features, and development guide.
*   `docs/CHANGELOG.md`: Detailed changelog of all updates and fixes.
*   `docs/prd.md`: The original Product Requirements Document that guided the development of this prototype.
*   `docs/archive/`: Contains archived documents related to the development process.
