# GEMINI.md - E-commerce Backend Context

## Project Overview

This is a Node.js-based backend for an e-commerce website, built using **Express** and **TypeScript**. It provides a RESTful API for product management, session-based cart operations, and order processing. The data is persisted in a **PostgreSQL** database.

### Core Technologies

| Category  | Technology        | Version / Notes                                        |
| --------- | ----------------- | ------------------------------------------------------ |
| Runtime   | Node.js           | v20 (Docker image)                                     |
| Framework | Express.js        | `^4.19.2` (Express 4)                                  |
| Language  | TypeScript        | `^5.5.4`, strict mode                                  |
| Database  | PostgreSQL        | v15 (Docker image), accessed via `pg ^8.12.0`          |
| Session   | `express-session` | `^1.18.0`, in-memory store (no external session store) |
| Cookies   | `cookie-parser`   | `^1.4.6`                                               |
| CORS      | `cors`            | `^2.8.5`, hardcoded to `http://localhost:5173`         |
| Env       | `dotenv`          | `^16.4.5`                                              |
| Container | Docker + Compose  | Single-stage build, `compose.yaml`                     |

### Architecture Characteristics

- **Layered Design**: Follows a strict Route → Controller → Service → Repository pattern for clean separation of concerns.
- **Centralized Error Handling**: Utilizes an `ApiError` class and global error handler middleware.
- **Environment Driven**: Configurations and secrets are loaded centrally from `src/config/index.ts`.
- **Structured Logging**: Uses `pino` and `pino-http` for high-performance JSON logging.

## Project Structure

```
E-commerce-backend/
├── src/
│   ├── app.ts                # Express application setup, middlewares, routes
│   ├── server.ts             # Application entry point, starts the server
│   ├── config/               # Configuration files (env parsing, database connection)
│   ├── controllers/          # HTTP request/response handlers
│   ├── middlewares/          # Custom Express middlewares (auth, error-handling, validate)
│   ├── repositories/         # Database access layer (raw queries encapsulated here)
│   ├── routes/               # Express router configurations
│   ├── schemas/              # Zod validation schemas
│   ├── services/             # Core business logic layer
│   ├── types/                # Shared TypeScript type definitions
│   └── utils/                # Helper utilities (logger, error classes, JWT functions)
├── tests/                    # Vitest testing directories (unit/integration/e2e)
├── db/                       # Database initialization scripts
├── Dockerfile
├── compose.yaml
├── package.json
└── tsconfig.json
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

| Command                                                 | Description                                          |
| ------------------------------------------------------- | ---------------------------------------------------- |
| `npm install`                                           | Install dependencies                                 |
| `npm run build`                                         | Compile TypeScript → `dist/`                         |
| `npm run dev`                                           | Run development server with `tsx` hot-reloading      |
| `docker compose -f compose.yaml -f compose.dev.yaml up` | Start local development environment with auto-reload |
| `docker compose up --build`                             | Start production-like environment                    |

## API Endpoints

### Authentication

| Method | Path            | Description                              |
| ------ | --------------- | ---------------------------------------- |
| `POST` | `/api/register` | Register a new user                      |
| `POST` | `/api/login`    | Login and receive an HTTPOnly JWT cookie |

### Products

| Method | Path                              | Description                                   |
| ------ | --------------------------------- | --------------------------------------------- |
| `GET`  | `/api/getProduct/:category?/:id?` | Fetch products. Use `all` for all categories. |

### Cart (Session-based, anonymous)

| Method   | Path            | Description                         |
| -------- | --------------- | ----------------------------------- |
| `GET`    | `/api/cart`     | Get current session cart            |
| `POST`   | `/api/cart`     | Add item to cart                    |
| `PUT`    | `/api/cart`     | Merge cookie cart with session cart |
| `PUT`    | `/api/cart/:id` | Update item quantity                |
| `DELETE` | `/api/cart/:id` | Remove item from cart               |
| `DELETE` | `/api/carts`    | Clear entire cart                   |

### Orders

| Method | Path             | Description                                      |
| ------ | ---------------- | ------------------------------------------------ |
| `POST` | `/api/order`     | Create order (stores payment info as plain JSON) |
| `GET`  | `/api/order/:id` | Get order by ID                                  |

## Key Types (defined in `src/index.ts`)

- `CartItem` — `{ productId, category, quantity }`
- `CardInfo` — `{ cardNumber, expiryMonth, expiryYear, securityCode }` ⚠️ PCI-sensitive
- `ATMInfo` — `{ bank, account, transferAccount }`
- `ShippmentInfo` — `{ city, district, road, detail }`
- `Recipient` — `{ name, phone, email }`
- `Order` — `{ products, price, recipient, shippment, paymentInfo, comment }`

## Database Schema

- **users**: `id (SERIAL PK)`, `email`, `password_hash`, `role`, `created_at`
- **products**: `id (SERIAL PK)`, `title`, `name`, `category`, `price (NUMERIC)`, `description`
- **orders**: `id (SERIAL PK)`, `order_date (TIMESTAMPTZ)`, `products (JSONB)`, `price (NUMERIC)`, `payment_method (TEXT)`, `payment_token (TEXT)`, `payment_status (TEXT)`, `recipient (JSONB)`, `address`, `remarks`, `paid (BOOL)`, `shipped (BOOL)`

## Security & Architecture Enhancements (Phases 0-6 Complete)

- **Architecture**: The massive monolithic `index.ts` was torn down and restructured into dedicated layers (`routes`, `controllers`, `services`, `repositories`), enabling isolated testing and cleaner code.
- **Performance (Database)**: Upgraded from `pg.Client` to a highly scalable `pg.Pool` to handle concurrent connections efficiently. Added indexing to `products` and `orders` tables for significantly faster querying.
- **Performance (Caching)**: Integrated `ioredis`. Express sessions are now persisted in Redis using `connect-redis`. The `ProductService` uses a Cache-Aside pattern (with a 5-minute TTL) to aggressively serve product lists directly from memory.
- **RESTful API Design**: Upgraded `/api/getProduct` to a standardized `/api/products` endpoint supporting pagination (`page`, `limit`) and sorting (`sort`, `order`).
- **Containerization & DevOps**: Implemented a highly optimized multi-stage `Dockerfile` (Node 22 Alpine, non-root user, `dumb-init`). Split Docker compose into `compose.yaml` (Production) and `compose.dev.yaml` (Development with `tsx` hot-reloading). Added `/health` monitoring endpoints and a GitHub Actions CI pipeline.
- **Observability**: Integrated `pino` and `pino-http` for robust, high-performance JSON structured logging across the application.
- **Agent-Readiness & Documentation**: Added `swagger-jsdoc` and `swagger-ui-express` to automatically generate and host OpenAPI 3.0 documentation at `/api-docs`. Embedded structural `// agent:` comments throughout the codebase to ensure future AI agents can instantly understand the architectural layout.
- **Error Handling**: Standardized error management through a centralized `ApiError` utility and global middleware.
- **Input Validation**: All incoming requests are now validated via `Zod` schemas and a global middleware (`src/middlewares/validate.middleware.ts`).
- **Security Middlewares**: Integrated `helmet`, `express-rate-limit`, `hpp`, and secure cookies based on the environment. CORS origins are dynamically configured.
- **Payment Security**: Raw credit card information (PAN) is no longer stored. The `orders` schema has been updated to use secure payment tokens.
- **Code Quality**: `ESLint v9`, `Prettier`, and strict TypeScript rules are enforced via Husky pre-commit hooks.
- **Testing**: `Vitest` is configured for future unit, integration, and E2E tests.

## Engineering Baselines

To guarantee the long-term stability and maintainability of the project, strict automated baselines have been established:

1. **Code Quality:** GitHub Actions CI enforces `0` ESLint warnings and `0` TypeScript compilation errors on every PR via Husky and lint-staged.
2. **Testing Coverage:** `vitest.config.ts` enforces a strict minimum code coverage of **80%** (Lines, Branches, Functions, Statements). The CI pipeline will fail if coverage drops below this threshold.
3. **Security:** The CI pipeline runs `npm audit --audit-level=high` before testing to block the merge of any high or critical vulnerability dependencies.
4. **Performance:** A baseline `k6` load test (`scripts/load-tests/baseline.k6.js`) ensures the API can sustain 50 concurrent users, requiring that 95% of requests complete in under **200ms** with a failure rate of `< 1%`.

## Development Conventions

- **RESTful Principles:** Endpoints follow standard HTTP methods for CRUD operations.
- **TypeScript:** Strict typing is preferred. Use `src/types` for shared interfaces and extensions.
- **Database Access:** Uses a centralized `queryDatabase` utility function in `index.ts` for consistent error handling.
- **Sessions:** The cart is managed via `express-session` on the server-side, with cookies for persistence.
