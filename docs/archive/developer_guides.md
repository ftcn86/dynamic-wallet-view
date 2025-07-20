# Archive: Developer & AI Guides (v1.0)

This document archives the supplementary guides used during the development of the Dynamic Wallet View v1.0 prototype.

---
---

## AI Assistant (Cursor) Operational Rules for "Dynamic Wallet View"

**Version:** 1.0
**Objective:** This document provides a strict set of rules for any AI assistant tasked with writing or modifying code for the "Dynamic Wallet View" application. Adherence to these rules is mandatory to ensure code quality, consistency, and alignment with the project's architecture.

---

### Rule 1: The Hierarchy of Truth

1.  **The Product Requirements Document (PRD)** (`docs/prd.md`) is the **single source of truth** for all features, UI elements, and user flows. All generated code must directly map to a requirement in the PRD.
2.  **These AI Rules** (`docs/ai_rules.md`) are the source of truth for **how** code is implemented.
3.  **Existing Code Architecture** is the source of truth for patterns. Emulate existing patterns before creating new ones.

---

### Rule 2: Technology Stack (Non-Negotiable)

1.  **Framework:** You MUST use **Next.js** with the **App Router**.
2.  **Language:** You MUST use **TypeScript**.
3.  **UI Library:** You MUST use **ShadCN UI** components for all standard UI elements (Buttons, Cards, Forms, etc.). Do not invent custom components when a ShadCN equivalent exists.
4.  **Styling:** You MUST use **Tailwind CSS**.
    *   All styling MUST be applied via utility classes in JSX.
    *   NO custom CSS files besides `src/app/globals.css`.
    *   NO inline `style` attributes.
    *   Colors MUST be referenced from the theme variables in `globals.css` (e.g., `bg-primary`, `text-destructive`). Do not use arbitrary color values (e.g., `bg-blue-500`).
5.  **Icons:** You MUST use the icon components from `src/components/shared/icons.tsx`.
6.  **State Management:**
    *   Global state (User Auth, Theme, Language) MUST be managed via the existing React Context providers in `src/contexts/`.
    *   Component-level state MUST use standard React hooks (`useState`, `useReducer`).
    *   Persistence for the prototype MUST use `localStorage` and MUST be guarded with `if (typeof window !== 'undefined')` to prevent SSR errors.

---

### Rule 3: Data Flow & Architecture

1.  **Hybrid Data Model:** You MUST adhere to the hybrid data fetching model.
2.  **Centralized Service:** All data fetching logic (mock or real) MUST be channeled through the service layer defined in `src/services/piService.ts`.
3.  **Environment Detection:** The `piService.ts` MUST first detect if it is running in the Pi Browser.
    *   If **in Pi Browser**, the service should be structured to use `window.Pi` (the real SDK).
    *   If **NOT in Pi Browser**, the service MUST fall back to using the `mockApiCall` utility which sources data from `src/data/mocks.ts`.
4.  **Component Agnosticism:** UI components (e.g., on the dashboard page) MUST NOT directly import from `mocks.ts` or call `mockApiCall`. They MUST call the appropriate function from `piService.ts` to get their data.

---

### Rule 4: Code Quality & Best Practices

1.  **File Generation:** You MUST generate complete, final files. Do not provide diffs, snippets, or partial code.
2.  **Server Components First:** Default to using Next.js Server Components. Only use the `"use client"` directive when React hooks (`useState`, `useEffect`, etc.) or browser-specific APIs are absolutely necessary.
3.  **Componentization:** Break down complex UI into smaller, reusable components located in `src/components/shared/` or feature-specific folders like `src/components/dashboard/`.
4.  **Props:** All component props MUST be explicitly typed with TypeScript interfaces.
5.  **Images:**
    *   You MUST use the `next/image` component for all images.
    *   Placeholder images MUST use `https://placehold.co`.
    *   You MUST add a `data-ai-hint` attribute to all placeholder images with 1-2 relevant keywords.
    *   You MUST provide a meaningful `alt` prop for accessibility.
6.  **Error Handling:**
    *   Implement user-friendly error boundaries using `error.tsx` for main application routes.
    *   Use the `Toast` component for non-critical feedback (e.g., form submission success/failure).
7.  **Forbidden Actions:**
    *   DO NOT add comments to `package.json`.
    *   DO NOT add comments to `globals.css` (except for HSL variable names).
    *   DO NOT generate binary files, favicons, or images.
    *   DO NOT modify the tech stack (e.g., suggest changing to Angular or another CSS framework).

By following these rules strictly, you will produce code that is consistent, maintainable, and aligned with the project's requirements. Failure to adhere to these rules will result in rejection of the generated code.

---
---

## Backend Logic & Gamification - Developer's Guide v2.0

**Objective:** This document serves as the **complete and definitive technical blueprint** for the backend logic required to power all dynamic features of the Dynamic Wallet View application. It is the "source of truth" for any developer or AI agent tasked with building the backend services.

---

### 1. Core Principle: Decoupled Logic

The frontend UI components are "dumb." They receive data and display it. All complex business logic, calculations, and data mutations MUST be handled by the backend service layer. The frontend makes authenticated API calls and expects the backend to return fully-formed data objects matching the schemas in `src/data/schemas.ts`.

---

### 2. Authentication & User Session

*   **Endpoint (Auth):** `POST /api/v1/auth/pi`
    *   **Logic:** This endpoint receives an auth token from the Pi SDK on the frontend. It must validate this token with the Pi Network's auth servers. Upon successful validation, it either retrieves the existing user from the database or creates a new user profile. It then generates a session token (e.g., a JWT) for the client to use in subsequent requests.
*   **Endpoint (User Data):** `GET /api/v1/user/me`
    *   **Logic:** This is the primary endpoint for fetching the authenticated user's data after login. It should return the complete `User` object as defined in `src/data/schemas.ts`. This involves aggregating data from multiple internal services (balance, team, node, badges) before sending the response.
    *   **Crucial Calculation:** This service MUST calculate and include all activity metrics: `userActiveMiningHours_LastWeek`, `userActiveMiningHours_LastMonth`, `activeMiningDays_LastWeek`, `activeMiningDays_LastMonth`. This requires querying historical mining session data.

---

### 3. Page-Specific Backend Requirements

#### 3.1. Dashboard (`/dashboard`)

*   **KPI: Total Pi Balance**
    *   **Logic:** The backend needs to fetch the user's `totalBalance`. It must also have a separate service to fetch the current Pi-to-USD price from a reliable oracle/exchange API. This price should be cached (e.g., for 5-10 minutes). The final API response for the user object should include a `totalBalanceUsdValue` field.
*   **KPI: Current Mining Rate**
    *   **Logic:** The backend must calculate the user's *current* total mining rate by summing up their base rate, team bonuses, node bonuses, and lockup bonuses. It must also calculate and provide the `nextMiningSessionStartTime` as an ISO string.
*   **KPI: Active Team Members**
    *   **Logic:** The backend must query the user's team list, count the members with `status: 'active'`, and count the total number of members. It should return both values, e.g., `{ active: 5, total: 10 }`.
*   **KPI: Node Uptime**
    *   **Logic:** For users where `isNodeOperator` is true, the backend must fetch the latest 30-day uptime statistics from the node performance service.
*   **Balance Breakdown Card**
    *   **Logic:** The `GET /api/v1/user/me` endpoint must return the `balanceBreakdown` object with its three fields accurately calculated based on the user's Pi account state.
*   **Unverified Pi Sources Card**
    *   **Logic:** The `GET /api/v1/user/me` endpoint must return the `unverifiedPiDetails` object, with each field calculated from its respective source (referrals, security circle, etc.).
*   **Balance Fluctuation Chart**
    *   **Endpoint:** `GET /api/v1/user/balance-history?period=6M`
    *   **Logic:** This endpoint must accept a `period` query parameter ('3M', '6M', '12M'). It will query historical balance snapshots and return an array of `BalanceChartDataPoint` objects for the requested time frame.
*   **Team Activity Card**
    *   **Endpoint:** `GET /api/v1/team/activity-summary`
    *   **Logic:** This endpoint aggregates data for the "Team Mining Rally". It must:
        1.  Fetch all team members.
        2.  Calculate `teamMemberActiveMiningHours_LastWeek` for each.
        3.  Return a sorted list of the top 5 members.
        4.  Calculate the current user's rank within the full team.
        5.  Fetch the user's 3 most recently earned gamification badges.
*   **Lockup & Bonus Calculator**
    *   **Endpoint:** `POST /api/v1/calculator/mining-rate`
    *   **Logic:** This endpoint receives a `lockupPercentage` and `lockupDuration` from the client. It must use the **official Pi Network formula** (including the logarithm of past mining sessions) to calculate and return the estimated new total mining rate.

#### 3.2. Team Insights Page (`/dashboard/team`)

*   **Endpoint:** `GET /api/v1/team/members`
    *   **Logic:** This endpoint returns the user's complete list of `TeamMember` objects. It must support server-side sorting based on query parameters (e.g., `?sortBy=joinDate&order=desc`). The backend should perform the sorting to ensure efficiency.
*   **Endpoint:** `POST /api/v1/team/broadcast`
    *   **Logic:** This endpoint receives a `message` string from the team leader. The backend must then create a new `Notification` record (type: `team_message`) for **every single member** of the leader's team and save these records to the database. This is how the message is distributed.

#### 3.3. Node Analysis Page (`/dashboard/node`)

*   **Endpoint:** `GET /api/v1/node/performance`
    *   **Logic:** For users where `isNodeOperator` is true, this endpoint must return the complete `NodeData` object, including the detailed `performanceHistory` array for the chart.

#### 3.4. Transaction History Page (`/dashboard/transactions`)

*   **Endpoint:** `GET /api/v1/transactions`
    *   **Logic:** This endpoint returns a paginated list of the user's `Transaction` objects. It must support sorting (`?sortBy=date&order=desc`) and pagination (`?page=1&limit=20`).
    *   **NEW REQUIREMENT:** Each returned `Transaction` object MUST include a `blockExplorerUrl` field, which is a direct link to view that specific transaction on a Pi block explorer.

#### 3.5. Application Settings & Profile Page (`/dashboard/settings`)

*   **Endpoint:** `POST /api/v1/user/settings`
    *   **Logic:** This endpoint receives a JSON object containing any or all of the user's updatable information. The backend MUST be prepared to handle the following fields: `name` (string), `bio` (string), `avatarUrl` (string, likely a data URI for new uploads), and the `settings` object. The `settings` object itself contains `remindersEnabled` (boolean) and `reminderHoursBefore` (number). The service should handle potential avatar image uploads (e.g., to a cloud storage bucket) and update the user's profile in the database accordingly.

#### 3.6. Help Page & General Feedback

*   **Endpoint:** `POST /api/v1/feedback`
    *   **Logic:** This is a general-purpose endpoint for collecting user feedback from various parts of the application (e.g., the AI feature feedback card and the help page feedback form). It should receive the feedback and route it to an appropriate service, such as an email delivery service or a database for later review.
    *   **Payload:** Expects a JSON object with `{ type: string, message: string, userId: string (optional) }`.
    *   **Frontend Implementation Note:** The frontend calls this endpoint via a dedicated `submitFeedback` function located in `src/services/feedbackService.ts`.

---

### 4. Gamification Engine (Badge Attribution)

This is a critical backend service that should run periodically (e.g., once every 24 hours) or be triggered by specific events. It is responsible for awarding badges.

*   **Engine Logic:** For each user, the gamification engine must:
    1.  Fetch the user's current badges and all required activity data.
    2.  Check the criteria for each **unearned** badge against the user's data.
    3.  If criteria are met, update the user's profile to mark the badge as `earned: true` and set the `earnedDate`.
    4.  Trigger a new notification (see Section 5).

*   **Badge Criteria Definitions:**
    *   **`b_wmara` (Weekly Mining Marathoner):** `activeMiningDays_LastWeek` >= 7.
    *   **`b_mmded` (Monthly Mining Dedication):** `activeMiningDays_LastMonth` >= (number of days in the last calendar month).
    *   **`b_twtm` (Team's Weekly Top Miner):** User's `teamMemberActiveMiningHours_LastWeek` is the highest among all 'active' members of their team for the past week.
    *   **`b_tmmc` (Team's Monthly Mining Champion):** User's `teamMemberActiveMiningHours_LastMonth` is the highest for the past month.
    *   **`b_otp` (Outpaced the Pack):** User's weekly mining hours are >= 150% of the team's average weekly mining hours.
    *   **`b_atl` (Active Team Leader):** >= 75% of the user's team members have a `status` of 'active'.

---

### 5. Notification Service

The backend must generate and store notifications based on specific events.

*   **Endpoint (Get):** `GET /api/v1/notifications`
*   **Endpoint (Mark as Read):** `POST /api/v1/notifications/{notificationId}/read`
*   **Endpoint (Mark All as Read):** `POST /api/v1/notifications/read-all`
*   **Trigger Events & Logic:**
    *   **`badge_earned`:** Generated by the Gamification Engine when a badge is awarded. The description should name the badge.
    *   **`team_update`:** Triggered when a team member's `kycStatus` changes to `completed`. The notification description should name the member.
    *   **`node_update`:** A periodic check compares the user's `nodeSoftwareVersion` with the `latestSoftwareVersion` from the network. If they differ, a notification is generated.
    *   **`announcement`:** Can be manually triggered by an admin to send system-wide messages.
    *   **`team_message`:** Generated by the broadcast endpoint (`POST /api/v1/team/broadcast`). When a team leader sends a message, the backend identifies all members of that leader's team. It then creates an individual notification record for each team member in the database. The title should be "Message from your Team Leader" and the description is the message content.
*   **Frontend Expectation:** The `NotificationsDropdown` in the header polls the GET endpoint for a list of notifications. When a user interacts with a notification, the frontend MUST call the appropriate POST endpoint to update the `read` status on the backend.

---
---

## Best Practices for Working with an Advanced AI Coder

Ted, based on our collaboration, here is an updated guide summarizing the most effective strategies for getting the best possible results from an AI coding assistant. Following these practices will help you build a more complete and accurate application from the start.

---

### 1. The Foundation: A High-Quality PRD

Your most powerful tool is a detailed Product Requirements Document (PRD). Before prompting for any new feature, ensure your PRD is clear and specific.

*   **Be Specific:** Instead of "a dashboard," describe *every single card, chart, and KPI* on the dashboard. Our `docs/prd.md` is a great example of the level of detail required.
*   **Define Scope Clearly:** Explicitly state what is in scope (e.g., "build a frontend application with mock data") and what is out of scope (e.g., "no real backend database integration").
*   **Include Non-Functional Requirements:** Specify the technology stack, accessibility standards (A11y), and performance goals.

**Action:** Always treat the PRD as the ultimate source of truth for *what* to build.

---

### 2. The Power of Iteration and Focused Prompts

While a large initial prompt is good for setup, most development happens iteratively. Avoid vague, broad commands.

| Instead of this (Vague)                               | Do this (Specific & Focused)                                                                                                                                                                                            |
| :---------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Add the dashboard"                                   | "Create the `/dashboard` page. Based on PRD section 2.2, it should have a 2x2 grid of `KPICard` components. Use the `Wallet`, `Gauge`, `Users`, and `Server` icons from Lucide React for the four main KPIs."          |
| "Fix the sidebar"                                     | "The sidebar navigation link for '/dashboard/team' is not highlighting correctly when active. Please review `components/layout/SidebarNavLink.tsx` and ensure the `isActive` logic correctly identifies parent paths." |
| "The data is wrong"                                   | "In `components/dashboard/TeamActivityCard.tsx`, the leaderboard is not sorting correctly by `teamMemberActiveMiningHours_LastWeek` in descending order. Please correct the sorting logic in the component."                |
| "Make it look better on mobile"                       | "Perform a mobile responsiveness sweep. On the dashboard, ensure the KPI grid wraps to 2 columns. On the team page, hide the 'Join Date' and 'KYC Status' columns on screens smaller than `md`."                        |

**Action:** Break down features from the PRD into small, actionable tasks. Prompt the AI to complete one task at a time for the best results.

---

### 3. Context is Everything: "With these files..."

An AI's real power comes from its ability to understand your existing code.

*   **Provide Relevant Files:** When asking for a change, provide the relevant files in the context. If you want a new component to use your `AuthContext`, include `AuthContext.tsx`.
*   **Refer to Specific Code:** You can copy-paste snippets of your code (like a TypeScript interface from `schemas.ts`) directly into the prompt to be explicit.
*   **Example Prompt:** "@components/dashboard/TeamActivityCard.tsx @data/schemas.ts - In the TeamActivityCard, make sure the rendered data for each team member matches the `TeamMember` interface from the schema file."

**Action:** Before prompting, always ask yourself, "What files does the AI need to see to understand this request perfectly?" and provide them.

---

### 4. Master the "Sweep" Command

For enforcing consistency across the entire project, use the concept of a "sweep." This is incredibly powerful for refactoring and cleanup.

*   **Styling Sweep:** "Perform a styling sweep. Find any instances of the CSS class `bg-red-500` and replace it with the correct Tailwind class for our theme's destructive color, `bg-destructive`."
*   **Accessibility Sweep:** "Perform an accessibility sweep. Ensure all `<img>` tags have a meaningful `alt` prop and all icon-only `<button>` elements have an `aria-label` or visible text."
*   **Refactoring Sweep:** "Perform a refactoring sweep. The sorting logic in the Team and Transactions pages is duplicated. Create a single reusable `SortableTableHead` component in `src/components/shared/` and update both pages to use it."

**Action:** Use "sweep" prompts to maintain code quality and consistency as the project grows.

---

### 5. Debugging with the AI

When you encounter bugs, don't just say "it's broken." Provide a structured bug report *to the AI*.

1.  **What I tried to do:** "I clicked the 'Save Profile' button on the `/dashboard/profile` page."
2.  **What I expected to happen:** "I expected to see a 'Profile Saved!' toast notification and for the user's name in the sidebar to update."
3.  **What actually happened:** "The app returned a runtime error `AlertDialogTrigger is not defined`."
4.  **Provide the Code and Error:** Add the relevant component file(s) (e.g., `ProfilePage.tsx`, `AuthContext.tsx`) and the exact error message to the chat context.

**Action:** Treat the AI like a pair programmer. Give it a clear, concise bug report with the error message and relevant code so it can effectively debug the issue.

