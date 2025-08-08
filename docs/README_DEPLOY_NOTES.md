Deploy & Ops Notes

One-time steps
- Run POST `/api/migrate/ensure` in production once to create missing tables/columns.
- Configure Vercel cron:
  - `0 * * * *` → POST `/api/cron/payment-reconcile`
  - `0 3 * * *` → POST `/api/cron/balance-rollup`

Cookies (Pi Browser)
- `session-token` must be `httpOnly`, `Secure`, `SameSite=None`, `Path=/`.

Verification
- Login via Pi Browser; inspect `session-token` cookie attributes.
- Perform a test donation/payment; notification bell updates and transaction stored.


