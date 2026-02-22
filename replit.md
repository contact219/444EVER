# 444 EVER Candle Company

## Overview
A modern e-commerce storefront for 444 EVER Candle Company, offering handmade dessert-inspired candles. Rebuilt from a Next.js + Prisma + SQLite app to React + Express + PostgreSQL on Replit. Includes a comprehensive admin dashboard for order management, product catalog CRUD, inventory tracking, customer CRM, promotions, analytics, and audit logging.

## Tech Stack
- **Frontend**: React + Vite + TypeScript + TailwindCSS + shadcn/ui + Framer Motion
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (frontend), Express (backend API)
- **State**: TanStack React Query + localStorage cart

## Architecture
- `client/src/pages/` - Storefront page components (home, shop, product-detail, cart, checkout, about)
- `client/src/pages/admin.tsx` - Admin layout shell with login, sidebar nav, and route switching
- `client/src/pages/admin/` - Admin sub-pages (overview, orders, order-detail, products, inventory, customers, customer-detail, promotions, reports, settings, audit-logs)
- `client/src/lib/admin.ts` - Admin auth token management, fetch wrappers, formatting utils
- `client/src/lib/cart.ts` - Client-side cart management (localStorage)
- `client/src/components/` - Shared components (navbar, footer, shadcn ui)
- `server/routes.ts` - API endpoints (storefront + admin, 40+ routes)
- `server/storage.ts` - Database storage interface (40+ methods)
- `server/seed.ts` - Seed data for products
- `shared/schema.ts` - Drizzle schema & TypeScript types

## Data Models
- **Product** - name, slug, description, imageUrl, active, featured, status, scentNotes, waxType, burnTime, tags, SEO fields, scheduledAt, isLimitedEdition, scentLine
- **Variant** - vessel, sizeOz, wickType (COTTON/WOOD), priceCents, sku, stockOnHand, stockReserved, reorderPoint, quantityCap
- **Order** - email, name, address, status (PENDING/PAID/FULFILLED/SHIPPED/DELIVERED/CANCELLED/REFUNDED), totals, tracking, refund info, promo code
- **OrderItem** - productName, variantLabel, quantity, price, lineTotalCents
- **OrderNote** - content, authorName (internal notes per order)
- **OrderEvent** - type, description (timeline events per order)
- **Customer** - email, name, address, phone, totalOrderCount, totalSpentCents, lastOrderAt, tags, notes
- **Category** - name, slug, description, sortOrder
- **Collection** - name, slug, description
- **InventoryAdjustment** - variantId, quantityChange, reason (RESTOCK/DAMAGE/CORRECTION/RETURN/SALE), notes
- **Promotion** - code, discountType (PERCENTAGE/FIXED_AMOUNT/FREE_SHIPPING), discountValue, minSpend, maxUsage, dates, customerEmail
- **AuditLog** - entityType, entityId, action, description, authorName, beforeData, afterData
- **Setting** - key/value pairs (shipping, tax, store info, branding)
- **AdminUser** - email, passwordHash, name, role (OWNER/ADMIN/STAFF/READONLY), active, resetToken, resetTokenExpiresAt, lastLoginAt
- **AutomationTemplate** - name, triggerType (POST_PURCHASE/REVIEW_REQUEST/RESTOCK_ALERT/ABANDON_CART), delayHours, subject, body, active, upsellProductId
- **AutomationSend** - templateId, orderId, customerId, customerEmail, status (PENDING/SENT/FAILED), scheduledFor, sentAt
- **Review** - productId, customerId, customerEmail, customerName, rating (1-5), title, body, verified, approved, incentiveCouponCode, orderId
- **WaitlistEntry** - productId, email, notified
- **Campaign** - name, segment, subject, body, promoCode, recipientCount, status (DRAFT/SENT), sentAt

## Admin Dashboard
- **Auth**: Token-based, stored in sessionStorage, sent as x-admin-token header
- **Login**: POST /api/admin/login with ADMIN_PASSWORD env var (default: "admin123")
- **Layout**: Sidebar nav + content area, mobile-responsive with hamburger menu
- **Pages**: Overview (KPIs), Orders (list + detail), Products (CRUD + variants), Inventory (stock + adjustments), Customers (list + detail), Segments (customer segmentation + campaign targeting), Drops (limited editions + waitlist), Promotions (CRUD), Promo Performance (analytics + inventory-aware auto-stop), Automations (templates + send history), Reviews (moderation + auto-coupon), Admin Users (multi-admin CRUD + password reset), Reports (charts + CSV export), Settings, Audit Logs

## API Routes
### Storefront
- GET /api/products - All active products with variants
- GET /api/products/featured - Featured products only
- GET /api/products/:slug - Single product by slug
- POST /api/checkout - Create order from cart items

### Admin (all require x-admin-token header)
- POST /api/admin/login - Admin password authentication
- GET /api/admin/kpis - Dashboard KPI metrics
- GET /api/admin/revenue-chart - Revenue by day
- GET /api/admin/top-products - Top products by revenue
- GET /api/admin/recent-activity - Recent activity feed
- GET/PATCH /api/admin/orders - List and update orders
- POST /api/admin/orders/:id/notes - Add internal notes
- POST /api/admin/orders/:id/refund - Process refund
- GET/POST/PATCH/DELETE /api/admin/products - Full product CRUD
- POST /api/admin/products/:id/variants - Add variants
- PATCH/DELETE /api/admin/variants/:id - Update/delete variants
- GET /api/admin/inventory - Inventory overview
- GET /api/admin/inventory/low-stock - Low stock alerts
- POST /api/admin/inventory/adjust - Stock adjustment
- GET /api/admin/inventory/adjustments - Adjustment history
- GET/PATCH /api/admin/customers - Customer management
- GET/POST/PATCH/DELETE /api/admin/promotions - Promotion CRUD
- GET /api/admin/reports/sales - Sales report data
- GET/PATCH /api/admin/settings - Store settings
- GET /api/admin/audit-logs - Audit log viewer
- GET/POST/PATCH/DELETE /api/admin/users - Admin user CRUD
- POST /api/admin/users/:id/reset-password - Generate password reset token
- POST /api/admin/reset-password - Reset password with token
- GET /api/admin/segments?segment= - Customer segment query (vip/first_time/inactive/repeat/all)
- GET /api/admin/segments/counts - Segment counts
- GET/POST/PATCH/DELETE /api/admin/campaigns - Campaign CRUD
- POST /api/admin/campaigns/:id/send - Send campaign
- GET/POST/PATCH/DELETE /api/admin/automations - Automation template CRUD
- GET /api/admin/automations/sends - Automation send history
- GET/PATCH/DELETE /api/admin/reviews - Review moderation
- GET /api/products/:slug/reviews - Public product reviews
- POST /api/products/:slug/reviews - Submit review (auto-coupon for verified)
- GET /api/admin/waitlist - Waitlist entries
- POST /api/waitlist - Join product waitlist
- POST /api/admin/waitlist/:id/notify - Mark waitlist entry notified
- GET /api/admin/promo-performance - Promo analytics
- POST /api/admin/promotions/:id/auto-stop - Inventory-aware promo auto-stop

## Design System
- Warm, dessert-inspired palette: deep plum primary, amber/gold accents, creamy ivory background
- Fonts: Playfair Display (headings), Montserrat (body)
- Dark mode supported via CSS variables

## Environment Variables
- DATABASE_URL - PostgreSQL connection
- ADMIN_PASSWORD - Admin panel access password
- SESSION_SECRET - Express session secret
