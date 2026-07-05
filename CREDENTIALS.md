# Development Credentials & Test Data

Quick reference for local development, admin access, customer accounts, and Stripe test payments.

> **Security:** These credentials are for **local development only**. Never use them in production or commit real API secrets.

---

## Local URLs

| Service        | URL                          |
|----------------|------------------------------|
| Storefront     | http://localhost:5173        |
| Admin panel    | http://localhost:5173/admin  |
| Login          | http://localhost:5173/login  |
| Backend API    | http://localhost:5001/api    |
| API health     | http://localhost:5001/api/health |

---

## Admin Login

| Field    | Value              |
|----------|--------------------|
| Email    | `admin@store.com`  |
| Password | `admin123`         |

After login you are redirected to `/admin` (Dashboard).

---

## Customer Accounts

Use these to test checkout, orders, and reviews.

| Name          | Email               | Password       |
|---------------|---------------------|----------------|
| John Doe      | `john@example.com`  | `customer123`  |
| Sarah Miller  | `sarah@example.com` | `customer123`  |
| Mike Chen     | `mike@example.com`  | `customer123`  |
| Emma Wilson   | `emma@example.com`  | `customer123`  |
| Alex Rivera   | `alex@example.com`  | `customer123`  |

---

## Stripe Test Card Details

Use these on the **Stripe Checkout** page (when Stripe keys are configured in `server/.env`).

### Successful payment (default)

| Field            | Value                |
|------------------|----------------------|
| Card number      | `4242 4242 4242 4242` |
| Expiry           | Any future date (e.g. `12 / 34`) |
| CVC              | Any 3 digits (e.g. `123`) |
| Name on card     | Any name             |
| ZIP / Postal     | Any valid code (e.g. `12345`) |

### Other useful test cards

| Scenario              | Card number           |
|-----------------------|-----------------------|
| Payment declined      | `4000 0000 0000 0002` |
| Insufficient funds    | `4000 0000 0000 9995` |
| Requires 3D Secure    | `4000 0025 0000 3155` |
| Expired card          | `4000 0000 0000 0069` |

Full list: [Stripe test cards](https://docs.stripe.com/testing#cards)

### Demo mode (no Stripe keys)

If `STRIPE_SECRET_KEY` is **not** set in `server/.env`, checkout shows a **“Simulate Payment Success”** button instead of redirecting to Stripe. No card is required.

---

## Test Coupons

| Code        | Discount                          | Min order |
|-------------|-----------------------------------|-----------|
| `WELCOME10` | 10% off (max $25 discount)        | $50       |
| `SAVE20`    | $20 off                           | $100      |

Apply at checkout on the order summary step.

---

## Payment Flow (Stripe enabled)

1. Log in as a customer (e.g. `john@example.com`).
2. Add products to cart → **Checkout**.
3. Fill shipping address → **Place Order**.
4. You are redirected to **Stripe Checkout**.
5. Pay with test card `4242 4242 4242 4242`.
6. Return to `/checkout/success` — payment is confirmed via `/api/orders/confirm-checkout`.
7. Order appears in **Admin → Orders** with `paymentStatus: paid`.
8. Revenue updates on **Admin → Dashboard** and **Analytics**.

If an order stays `pending` after payment, open **Admin → Orders** and set payment status to **Paid** manually.

---

## Database Seed

From the `server` directory:

```bash
# Full reset + sample products, orders, reviews, users
npm run seed

# Add demo orders/reviews without wiping existing data (skips if paid orders exist)
npm run seed:demo
```

After `npm run seed` you get roughly:

- 6 products, 8 categories, 3 banners, 2 coupons
- 28 orders (~24 paid, ~$5,700 revenue)
- 8 reviews (pending / approved / rejected mix)
- 5 customers + 1 admin

---

## Environment Variables

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:5001/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

Copy from `client/.env.example`. Vite dev server proxies `/api` → `http://localhost:5001` if `VITE_API_URL` is omitted.

### Server (`server/.env`) — required for full stack

| Variable                 | Example                          | Purpose                    |
|--------------------------|----------------------------------|----------------------------|
| `PORT`                   | `5001`                           | Backend port               |
| `CLIENT_URL`             | `http://localhost:5173`          | CORS + OAuth redirects     |
| `API_URL`                | `http://localhost:5001`          | OAuth callback base        |
| `MONGODB_URI`            | `mongodb+srv://...`              | Database                   |
| `JWT_SECRET`             | 32+ char secret                  | Auth tokens                |
| `STRIPE_SECRET_KEY`      | `sk_test_...`                    | Stripe Checkout            |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...`                    | Must match client key      |
| `STRIPE_WEBHOOK_SECRET`  | `whsec_...`                      | Optional for webhooks      |
| `GOOGLE_CLIENT_ID`       | `...apps.googleusercontent.com`  | Optional Google OAuth      |
| `GOOGLE_CLIENT_SECRET`   | `GOCSPX-...`                     | Optional Google OAuth      |

Google OAuth redirect URI (local):

```
http://localhost:5001/api/auth/oauth/google/callback
```

---

## Admin Panel Sections

| Route               | Purpose                                      |
|---------------------|----------------------------------------------|
| `/admin`            | Dashboard — revenue, orders, sales chart     |
| `/admin/products`   | CRUD products, images, pricing               |
| `/admin/inventory`  | Stock levels per size                        |
| `/admin/orders`     | Order + payment status management            |
| `/admin/customers`  | Registered customers                         |
| `/admin/categories` | Category tree                                |
| `/admin/coupons`    | Discount codes                               |
| `/admin/analytics`  | Sales charts, top products, category revenue |
| `/admin/banners`    | Homepage hero banners                        |
| `/admin/reviews`    | Moderate product reviews                     |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Dashboard shows $0 revenue | Orders may be `pending` — mark as **Paid** in Admin → Orders, or complete Stripe checkout |
| Stripe redirect fails | Check `STRIPE_SECRET_KEY` in `server/.env` and restart backend |
| Login fails after seed | Run `npm run seed` in `server` to recreate users |
| Empty admin data | Run `npm run seed` or `npm run seed:demo` |
| CORS / API errors | Ensure backend runs on port **5001** and `VITE_API_URL` matches |
