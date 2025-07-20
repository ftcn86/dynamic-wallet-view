# AI Assistant (Cursor) Operational Rules for "Dynamic Pi Wallet View"

**Version:** 1.0
**Objective:** This document provides a strict set of rules for any AI assistant tasked with writing or modifying code for the "Dynamic Pi Wallet View" application. Adherence to these rules is mandatory to ensure code quality, consistency, and alignment with the project's architecture.

---

## Rule 1: The Hierarchy of Truth

1.  **The Product Requirements Document (PRD)** (`docs/prd.md`) is the **single source of truth** for all features, UI elements, and user flows. All generated code must directly map to a requirement in the PRD.
2.  **These AI Rules** (`docs/ai_rules.md`) are the source of truth for **how** code is implemented.
3.  **Existing Code Architecture** is the source of truth for patterns. Emulate existing patterns before creating new ones.

---

## Rule 2: Technology Stack (Non-Negotiable)

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

## Rule 3: Data Flow & Architecture

1.  **Hybrid Data Model:** You MUST adhere to the hybrid data fetching model.
2.  **Centralized Service:** All data fetching logic (mock or real) MUST be channeled through the service layer defined in `src/services/piService.ts`.
3.  **Environment Detection:** The `piService.ts` MUST first detect if it is running in the Pi Browser.
    *   If **in Pi Browser**, the service should be structured to use `window.Pi` (the real SDK).
    *   If **NOT in Pi Browser**, the service MUST fall back to using the `mockApiCall` utility which sources data from `src/data/mocks.ts`.
4.  **Component Agnosticism:** UI components (e.g., on the dashboard page) MUST NOT directly import from `mocks.ts` or call `mockApiCall`. They MUST call the appropriate function from `piService.ts` to get their data.

---

## Rule 4: Code Quality & Best Practices

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
