
# Product Requirements Document: Dynamic Wallet View
## Application Specification

**Version:** 1.0
**Date:** (Current Date)
**Objective:** To create a comprehensive, user-friendly, and engaging dashboard application for Pi Network users, named "Dynamic Wallet View." This application will provide detailed insights into their Pi holdings, mining activity, team performance, and node operations, while fostering motivation through gamification and community support via donations. It is built with a modern, responsive UI, prioritizing clarity, performance, and a clear path to production integration.

---

## 1. Core User & Value Proposition

*   **Target User:** A representative Pi Network Pioneer (miner, team builder, node operator).
*   **User Need:** To visualize and interact with a single, well-designed interface displaying consolidated Pi-related metrics, tracking progress, managing team insights, and analyzing node performance.
*   **Value Proposition:** Dynamic Wallet View empowers users with better information and engagement tools through a dynamic, insightful, and beautifully designed alternative/enhancement to viewing Pi Network data. *This application is a viewer and insights tool, not a functional wallet for transfers, though it can initiate Pi App payments for specific actions like donations.*

---

## 2. Core Features & Functionality

### 2.1. User Authentication & Onboarding (Mocked/Real)
*   **2.1.1. Login:**
    *   Simulates/Initiates Pi Network authentication via the `piService`.
    *   Display app name "Dynamic Wallet View" and welcome message.
    *   Links to Legal pages (Terms, Privacy).
*   **2.1.2. Terms Acceptance:**
    *   Mandatory review and acceptance of Terms of Service & Privacy Policy post-initial login before accessing the main app.
    *   Option to logout if terms are not accepted.
*   **2.1.3. Session Management:**
    *   Session persistence using `localStorage` to store the user object and preferences. **Must include `typeof window !== 'undefined'` checks to prevent SSR errors.**
*   **2.1.4. Logout:**
    *   Clear user session from `localStorage`.
    *   Confirmation dialog before logout.
    *   Redirect to login page.

### 2.2. Main Dashboard (`/dashboard`)
*   **2.2.1. Key Performance Indicators (KPIs) - Top Section:**
    *   **Total Pi Balance:** Displays user's total Pi. Icon: `Wallet`.
    *   **Current Mining Rate:** Displays current Pi mining rate per hour. Icon: `Gauge`. Clickable, shows AlertDialog prompting to redirect to Pi App mining section (mock URL `pi://mine`).
    *   **Active Team Members:** Displays `active_members / total_members`. Icon: `Users`. Clickable, links to `/dashboard/team`.
    *   **Node Uptime (Conditional):** If `user.isNodeOperator` is true, displays node uptime percentage. Icon: `Server`. Clickable, links to `/dashboard/node`.
*   **2.2.2. Balance Breakdown Card:**
    *   Title: "Balance Breakdown".
    *   Displays data for:
        *   Transferable to Mainnet (Pi amount).
        *   Total Unverified Pi (Pi amount).
        *   Currently in Lockups (Pi amount).
    *   Disclaimer: "Note: Unverified Pi requires associated members to complete KYC to become transferable."
*   **2.2.3. Unverified Pi Detail Card:**
    *   Title: "Unverified Pi Sources". Icon: `ListTree`.
    *   Displays amounts for:
        *   From Referral Team. Icon: `Users`.
        *   From Security Circle. Icon: `Shield`.
        *   From Node Rewards. Icon: `Server`.
        *   From Other Bonuses. Icon: `Gift`.
    *   Disclaimer: "These amounts become transferable as your connections complete KYC or other conditions are met."
*   **2.2.4. Balance Fluctuation Chart Card (Portfolio Tab):**
    *   Title: "Balance Fluctuation".
    *   Chart Type: Bar chart (using Recharts/ShadCN Charts).
    *   Data: Shows historical "Transferable" and "Unverified" Pi amounts.
    *   Time Period Selector: "3M", "6M", "12M" options, changing the displayed chart data.
    *   Y-Axis Label: "Pi Amount".
    *   Tooltip: Show exact values for Transferable and Unverified on hover.
*   **2.2.5. My Badges Card (Achievements Tab):**
    *   Title: "My Badges".
    *   Displays a grid of user's earned and unearned badges (full color icons vs grayscale).
    *   Clicking a badge opens a Dialog showing details.
*   **2.2.6. Lockup Calculator & AI Feedback (Analysis Tab):**
    *   Title: "Analysis & Future Features".
    *   **Lockup & Bonus Calculator:** Interactive sliders for `Lockup Percentage` and `Lockup Duration`. Displays the estimated resulting mining rate boost in real-time. Disclaimer about estimates.
    *   **AI Feature Feedback Card:** A card that poses a question to the user about a potential future AI feature (e.g., personalized mining strategies). It includes a textarea for feedback and a submission button. This is for collecting user opinions, not a functional AI tool.
*   **2.2.7. Team Activity Card (Overview Tab):**
    *   Title: "Team Mining Rally". Icon: `Trophy`.
    *   **Weekly Team Rally Leaderboard (Top 5):** Table showing Rank, Member, Hours.
    *   **Recent Achievements (Badges):** Display ~3 most recently earned badges.
    *   Footer Button: "View Full Team Report" linking to `/dashboard/team`.

### 2.3. Team Insights Page (`/dashboard/team`)
*   **2.3.1. Title:** "Security & Team Insights".
*   **2.3.2. Team Members Table (from data service):**
    *   Columns (all sortable): Member, Join Date, Status, KYC Status, Contribution, Activity.
    *   Table is responsive, hiding less critical columns on smaller screens.
    *   Loading, error, and empty states.
*   **2.3.3. Team Management Tools:**
    *   A card with tools for team leaders.
    *   **Ping Inactive Members:** A button to simulate sending a reminder notification to inactive members.
    *   **Send Broadcast:** A textarea and button to send a message to all team members, delivered as a notification.

### 2.4. Node Analysis Page (`/dashboard/node`)
*   **2.4.1. Title:** "Node Analysis".
*   **2.4.2. Conditional View (based on `user.isNodeOperator`):**
    *   **If Operator:** Show KPIs for "Node Uptime" and "Performance Score", and a "Performance History" line chart.
    *   **If Not Operator:** Show a card encouraging the user to "Become a Node Operator" with a link to the Pi Network site.

### 2.5. Transaction History Page (`/dashboard/transactions`)
*   **2.5.1. Title:** "Transaction History".
*   **2.5.2. Transaction Table:**
    *   Displays a list of all user transactions (sent, received, rewards).
    *   Columns include Type, Details, Amount, Status, and Date.
    *   Table is responsive for mobile viewing.

### 2.6. Application Settings Page (`/dashboard/settings`)
*   **2.6.1. Title:** "Settings & Profile".
*   **2.6.2. Merged Functionality:** This page now combines profile editing and application settings.
*   **2.6.3. Profile Information Card:**
    *   Form elements for Profile Picture (with mock upload), Display Name, and Bio.
    *   Saves updates to the `localStorage` user object.
*   **2.6.4. Display Preferences Card:**
    *   Theme Selection: Options for Light, Dark, System. Persists choice to `localStorage` via `next-themes`.
*   **2.6.5. Notifications Card:**
    *   A toggle switch to enable/disable notifications for mining session expiry.
    *   An input field to configure reminder time (e.g., 1 hour before expiry).
    *   Saves preferences to the user object in `localStorage`.

### 2.7. Donation Page (`/dashboard/donate`)
*   **2.7.1. Title:** "Support Dynamic Wallet View".
*   **2.7.2. Donation Form:** An input field for the donation amount and preset buttons.
*   **2.7.3. Mock Payment Flow:** An `AlertDialog` simulates the Pi payment confirmation flow.

### 2.8. Legal & Informational Pages
*   **2.8.1. Pages:** Terms of Service (`/legal/terms`), Privacy Policy (`/legal/privacy`), Help & Support (`/legal/help`).
*   **2.8.2. Layout:** Use a common `LegalPageLayout.tsx` with an Accordion or Markdown display for content.
*   **2.8.3. Help Page Feedback:** The `/legal/help` page includes a dedicated feedback form for users to submit general help requests or report issues.

### 2.9. Sidebar Navigation & Header
*   **2.9.1. Sidebar:** Collapsible design with responsive behavior for mobile. The "Profile" link has been removed.
*   **2.9.2. Header:** Displays a welcome message and contains the user profile dropdown and a notification center. The dropdown now links to `/dashboard/settings`.
*   **2.9.3. Notification Center:**
    *   Dropdown menu displaying recent, relevant user notifications (e.g., badge earned, team member KYC'd, app announcements).
    *   Notifications link directly to the relevant part of the app (e.g., Achievements tab).
    *   Includes functionality to mark individual notifications and all notifications as read, which updates their visual state.

---

## 3. Non-Functional Requirements

### 3.1. Pi Platform Integration & Data Abstraction
*   **3.1.1. Hybrid Data Flow:** The application MUST use a central service layer (`src/services/piService.ts`) for all data fetching.
*   **3.1.2. Environment Detection:** This service will contain logic to detect if the app is running within the Pi Browser (e.g., by checking for `window.Pi`).
*   **3.1.3. Real vs. Mock:**
    *   If **in Pi Browser**, the service is designed to make **real Pi SDK calls**. This structure allows for real integration.
    *   If **NOT** in the Pi Browser, it must fall back to using the **mock data** system via the `mockApiCall` utility. This allows for rapid UI development in a standard browser.
*   **3.1.4. SSR Protection:** All code that accesses browser-specific APIs (like `localStorage` or `window`) MUST be protected with checks like `if (typeof window !== 'undefined')` to prevent server-side rendering errors.

### 3.2. Technology Stack & Best Practices
*   **Stack:** Next.js (App Router, latest stable), React (latest stable), TypeScript, ShadCN UI, Tailwind CSS.
*   **State Management:** React Context API (`AuthContext`) with `localStorage` for persistence.
*   **Data Fetching:** All data fetching operations must be channeled through the `piService`. UI components should not directly call `mockApiCall`.
*   **Language:** The application will be **English-only** to simplify development.

### 3.3. Performance & Optimization
*   **Image Optimization:** All images must use the `next/image` component.
*   **Responsiveness:** The application must be fully responsive and provide an excellent user experience on both desktop and mobile devices.
*   **Memoization:** Components that are expensive to re-render should be wrapped in `React.memo` to prevent unnecessary re-renders.

### 3.4. Accessibility (A11y)
*   **Compliance:** Aim for WCAG 2.1 Level AA compliance.
*   **Requirements:** Must be fully keyboard navigable. All interactive elements must have clear focus states. All images must have meaningful `alt` text. ARIA attributes must be used where semantic HTML is insufficient.

---

## 4. Style Guidelines (Theme - `globals.css` & `tailwind.config.ts`)

*   **Primary Color:** Moderate purple (HSL: `250 60% 60%` / approx. `#735cd6`).
*   **Background Color (Light Theme):** Very light purple (HSL: `250 67% 97%` / approx. `#f2f0fc`).
*   **Background Color (Dark Theme):** Dark desaturated purple (HSL: `250 10% 18%`).
*   **Accent Color:** Muted pink (HSL: `317 54% 64%` / approx. `#d673b8`).
*   **Font:** 'Inter' (sans-serif) for body and headlines. Linked from Google Fonts.
*   **Layout:** Card-based for modularity, using ShadCN `Card` components.

---

## 5. Data Schemas (To be strictly defined in `src/data/schemas.ts`)

*   **User:** id, username, name, avatarUrl, bio, totalBalance, miningRate, isNodeOperator, nodeUptimePercentage, balanceBreakdown (object), unverifiedPiDetails (object), badges (array), activity metrics, termsAccepted (boolean), **settings (object)**.
*   **Badge:** id, name, description, iconUrl, earned (boolean), earnedDate (string, ISO format), dataAiHint (string, optional).
*   **TeamMember:** id, name, avatarUrl, joinDate, status, unverifiedPiContribution, activity metrics, kycStatus.
*   **NodeData:** nodeId, uptimePercentage, performanceScore, performanceHistory (array of {date, score}).
*   **LegalSection:** title, content.
*   **BalanceChartDataPoint:** date, transferable, unverified.
*   **Transaction:** id, date, type, amount, status, from/to, description.
*   **Notification:** id, type, title, description, date, read, link.
*   **UserSettings:** remindersEnabled (boolean), reminderHoursBefore (number).

---

## 6. Future Considerations & Roadmap (Out of Scope for Prototype)

*   Real backend API integration (beyond Pi SDK stubs).
*   Real database integration.
*   Functional Genkit AI features (pending user feedback).
*   Real push notifications.
