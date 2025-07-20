# Backend Logic & Gamification - Developer's Guide v2.0

**Objective:** This document serves as the **complete and definitive technical blueprint** for the backend logic required to power all dynamic features of the Dynamic Pi Wallet View application. It is the "source of truth" for any developer or AI agent tasked with building the backend services.

---

## 1. Core Principle: Decoupled Logic

The frontend UI components are "dumb." They receive data and display it. All complex business logic, calculations, and data mutations MUST be handled by the backend service layer. The frontend makes authenticated API calls and expects the backend to return fully-formed data objects matching the schemas in `src/data/schemas.ts`.

---

## 2. Authentication & User Session

*   **Endpoint (Auth):** `POST /api/v1/auth/pi`
    *   **Logic:** This endpoint receives an auth token from the Pi SDK on the frontend. It must validate this token with the Pi Network's auth servers. Upon successful validation, it either retrieves the existing user from the database or creates a new user profile. It then generates a session token (e.g., a JWT) for the client to use in subsequent requests.
*   **Endpoint (User Data):** `GET /api/v1/user/me`
    *   **Logic:** This is the primary endpoint for fetching the authenticated user's data after login. It should return the complete `User` object as defined in `src/data/schemas.ts`. This involves aggregating data from multiple internal services (balance, team, node, badges) before sending the response.
    *   **Crucial Calculation:** This service MUST calculate and include all activity metrics: `userActiveMiningHours_LastWeek`, `userActiveMiningHours_LastMonth`, `activeMiningDays_LastWeek`, `activeMiningDays_LastMonth`. This requires querying historical mining session data.

---

## 3. Page-Specific Backend Requirements

### 3.1. Dashboard (`/dashboard`)

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

### 3.2. Team Insights Page (`/dashboard/team`)

*   **Endpoint:** `GET /api/v1/team/members`
    *   **Logic:** This endpoint returns the user's complete list of `TeamMember` objects. It must support server-side sorting based on query parameters (e.g., `?sortBy=joinDate&order=desc`). The backend should perform the sorting to ensure efficiency.
*   **Endpoint:** `POST /api/v1/team/broadcast`
    *   **Logic:** This endpoint receives a `message` string from the team leader. The backend must then create a new `Notification` record (type: `team_message`) for **every single member** of the leader's team and save these records to the database. This is how the message is distributed.

### 3.3. Node Analysis Page (`/dashboard/node`)

*   **Endpoint:** `GET /api/v1/node/performance`
    *   **Logic:** For users where `isNodeOperator` is true, this endpoint must return the complete `NodeData` object, including the detailed `performanceHistory` array for the chart.

### 3.4. Transaction History Page (`/dashboard/transactions`)

*   **Endpoint:** `GET /api/v1/transactions`
    *   **Logic:** This endpoint returns a paginated list of the user's `Transaction` objects. It must support sorting (`?sortBy=date&order=desc`) and pagination (`?page=1&limit=20`).
    *   **NEW REQUIREMENT:** Each returned `Transaction` object MUST include a `blockExplorerUrl` field, which is a direct link to view that specific transaction on a Pi block explorer.

### 3.5. Application Settings & Profile Page (`/dashboard/settings`)

*   **Endpoint:** `POST /api/v1/user/settings`
    *   **Logic:** This endpoint receives an object containing any or all of the user's updatable information: `name`, `bio`, `avatarUrl`, and the `settings` object (`remindersEnabled`, `reminderHoursBefore`). It should handle avatar image uploads (e.g., to a cloud storage bucket) and update the user's profile in the database accordingly.

---

## 4. Gamification Engine (Badge Attribution)

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

## 5. Notification Service

The backend must generate and store notifications based on specific events.

*   **Endpoint:** `GET /api/v1/notifications`
*   **Trigger Events & Logic:**
    *   **`badge_earned`:** Generated by the Gamification Engine when a badge is awarded. The description should name the badge.
    *   **`team_update`:** Triggered when a team member's `kycStatus` changes to `completed`. The notification description should name the member.
    *   **`node_update`:** A periodic check compares the user's `nodeSoftwareVersion` with the `latestSoftwareVersion` from the network. If they differ, a notification is generated.
    *   **`announcement`:** Can be manually triggered by an admin to send system-wide messages.
    *   **`team_message`:** Generated by the broadcast endpoint (`POST /api/v1/team/broadcast`). When a team leader sends a message, the backend identifies all members of that leader's team. It then creates an individual notification record for each team member in the database. The title should be "Message from your Team Leader" and the description is the message content.
*   **Frontend Expectation:** The `NotificationsDropdown` in the header polls this endpoint to get a list of notifications, which it then displays. The backend should handle the `read` status of each notification.
