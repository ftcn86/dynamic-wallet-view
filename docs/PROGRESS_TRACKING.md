# Project Progress Tracker

This file is the single source of truth for remaining work, compliance requirements, and status updates. Update in-place as tasks move.

## Legend

- [ ] TODO
- [~] In progress
- [x] Done

## P0 – Security, Compliance, Data Integrity

- [~] Session cookie hardening (production)
  - Ensure `session-token` has: httpOnly, Secure, SameSite=None (Pi Browser requires cross-site cookie). Owner: Backend
  - Verification: inspect response set-cookie in prod; test login in Pi Browser retains session
- [ ] Schedulers configured (production)
  - Hourly: POST `/api/cron/payment-reconcile`
  - Daily: POST `/api/cron/balance-rollup`
  - Add environment secret if needed; record schedule in README Deploy section
- [ ] Remove production mocks
  - Node performance endpoint returns DB/real data only
  - Remove any localStorage fallbacks outside ads; gate dev-only code with `NODE_ENV==='development'`

## P1 – Product Surface & Persistence

- [ ] Notifications coverage complete
  - Events: payments (approve/complete/cancel/error), donations, ads (reward/error), team broadcast, profile key actions
  - Remove legacy in-memory notification helpers after parity
- [ ] Balance history chart uses DB
  - Ensure `/api/user/balance-history` feeds chart; backfill via daily rollup
- [ ] Ads safeguards
  - Basic device/IP hashing; per-device daily caps; simple admin report page; env-driven caps

## P2 – Risk Controls & Observability

- [ ] Rate limiting coverage
  - Extend to all auth routes and sensitive endpoints; standardize key format
- [ ] Logging/Monitoring
  - Replace remaining `console.*` with `lib/log` and add minimal server error hook (provider TBD)

## UX polish

- [~] Team page small-device QA; adjust spacing if needed
- [x] Profile bottom menu (Settings/Logout); remove logout from settings
- [x] Dashboard full-page scroll

## Compliance checklist (Pi Platform)

- [x] Frontend uses `Pi.authenticate(['username','payments','wallet_address'], onIncompletePaymentFound)`
- [x] Server-side approval/completion only; Platform API key never on client
- [x] No tokens in localStorage; sessions via cookie

## Notes / Decisions

- DB ensure endpoint is idempotent; run once per environment. Guard access as needed.

## Last updated

- <set on commit>


