# 444EVER (Next.js + Prisma)

Storefront + simple admin backend for 444 EVER Candle Company.

## Local setup

```bash
npm install
cp .env.example .env
# edit ADMIN_PASSWORD in .env
npm run db:migrate
npm run db:seed
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin

## Notes
- DB: SQLite (`dev.db`)
- Flat-rate shipping: Setting `shippingFlatCents` (seeded to **$8.00**)
