# GEMINI.md - E-commerce Backend Context

## Project Overview
This is a Node.js-based backend for an e-commerce website, built using **Express** and **TypeScript**. It provides a RESTful API for product management, session-based cart operations, and order processing. The data is persisted in a **PostgreSQL** database.

### Core Technologies
| Category | Technology | Version / Notes |
|---|---|---|
| Runtime | Node.js | v20 (Docker image) |
| Framework | Express.js | `^4.19.2` (Express 4) |
| Language | TypeScript | `^5.5.4`, strict mode |
| Database | PostgreSQL | v15 (Docker image), accessed via `pg ^8.12.0` |
| Session | `express-session` | `^1.18.0`, in-memory store (no external session store) |
| Cookies | `cookie-parser` | `^1.4.6` |
| CORS | `cors` | `^2.8.5`, hardcoded to `http://localhost:5173` |
| Env | `dotenv` | `^16.4.5` |
| Container | Docker + Compose | Single-stage build, `compose.yaml` |

### Architecture Characteristics
- **Monolithic single-file**: All route handlers, types, DB client, and middleware setup reside in `src/index.ts` (331 lines).
- **No authentication/authorization**: No user system; cart relies solely on anonymous sessions.
- **No input validation or sanitization**: Request bodies are trusted without schema validation.
- **No test suite**: `npm test` is a placeholder (`echo "Error: no test specified"`).
- **No logging framework**: Uses raw `console.log` / `console.error`.
- **No rate limiting or security headers**: Missing `helmet`, rate limiter, CSRF protection.

## Project Structure
```
E-commerce-backend/
├── src/
│   ├── index.ts              # Main entry: server, routes, DB client, all types
│   ├── index.js              # Compiled JS (should be in dist/, appears duplicated)
│   ├── service/
│   │   ├── authenticate.service.ts   # Placeholder (empty)
│   │   └── authenticate.service.js   # Compiled placeholder
│   └── types/
│       └── express-session.d.ts      # Extends SessionData with cart: CartItem[]
├── db/
│   └── init.sql              # Schema: products, orders tables + seed data
├── Dockerfile                # Single-stage, node:20, no .dockerignore
├── compose.yaml              # backend + postgres:15, dev volumes
├── coupon.json               # Static coupon data (expired 2024/10)
├── package.json
├── tsconfig.json
├── .env                      # DB creds, session/cookie secrets
└── .gitignore
```

## Building and Running

### Prerequisites
- Node.js and npm installed.
- PostgreSQL database running.
- A `.env` file with the following keys:
  - `POSTGRES_USER`
  - `POSTGRES_HOST`
  - `POSTGRES_DATABASE`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_PORT`
  - `SESSION_SECRET`
  - `MYCOOKIESECRET`

### Commands
| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run dev` | Build + run `dist/index.js` |
| `docker compose up` | Start backend + Postgres containers |

## API Endpoints

### Products
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/getProduct/:category?/:id?` | Fetch products. Use `all` for all categories. |

### Cart (Session-based, anonymous)
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/cart` | Get current session cart |
| `POST` | `/api/cart` | Add item to cart |
| `PUT` | `/api/cart` | Merge cookie cart with session cart |
| `PUT` | `/api/cart/:id` | Update item quantity |
| `DELETE` | `/api/cart/:id` | Remove item from cart |
| `DELETE` | `/api/carts` | Clear entire cart |

### Orders
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/order` | Create order (stores payment info as plain JSON) |
| `GET` | `/api/order/:id` | Get order by ID |

## Key Types (defined in `src/index.ts`)
- `CartItem` — `{ productId, category, quantity }`
- `CardInfo` — `{ cardNumber, expiryMonth, expiryYear, securityCode }` ⚠️ PCI-sensitive
- `ATMInfo` — `{ bank, account, transferAccount }`
- `ShippmentInfo` — `{ city, district, road, detail }`
- `Recipient` — `{ name, phone, email }`
- `Order` — `{ products, price, recipient, shippment, paymentInfo, comment }`

## Database Schema
- **products**: `id (SERIAL PK)`, `title`, `name`, `category`, `price (NUMERIC)`, `description`
- **orders**: `id (SERIAL PK)`, `order_date (TIMESTAMPTZ)`, `products (JSONB)`, `price (NUMERIC)`, `payment (JSONB)` ⚠️, `recipient (JSONB)`, `address`, `remarks`, `paid (BOOL)`, `shipped (BOOL)`

## Known Issues & Technical Debt
1. **Security**: Payment card data (PAN, CVV) stored in plain JSONB — PCI DSS violation.
2. **Security**: Weak, hardcoded session/cookie secrets in `.env`.
3. **Security**: No input validation; SQL injection risk mitigated only by parameterized queries.
4. **Security**: No authentication or authorization layer.
5. **Security**: CORS origin hardcoded; `cookie.secure: false`.
6. **Architecture**: Monolithic `index.ts` — routes, business logic, DB access, and types all in one file.
7. **Performance**: In-memory session store — data lost on restart, not scalable.
8. **Performance**: Single `pg.Client` connection — no connection pooling.
9. **Container**: No `.dockerignore`, no multi-stage build, no health check.
10. **Testing**: Zero test coverage.
11. **Data**: `coupon.json` contains expired coupons (2024/10) and a typo (`expirement`).
12. **Bug**: `GET /api/order/:id` passes `req.params` object (not `req.params.id`) to query.
13. **Error Handling**: `DELETE /api/carts` returns `200` even on error.
14. **Compiled JS**: `src/index.js` and `src/service/authenticate.service.js` exist alongside `.ts` files in `src/` (should only be in `dist/`).

## Development Conventions
- **RESTful Principles:** Endpoints follow standard HTTP methods for CRUD operations.
- **TypeScript:** Strict typing is preferred. Use `src/types` for shared interfaces and extensions.
- **Database Access:** Uses a centralized `queryDatabase` utility function in `index.ts` for consistent error handling.
- **Sessions:** The cart is managed via `express-session` on the server-side, with cookies for persistence.
