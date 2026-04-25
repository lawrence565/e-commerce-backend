# GEMINI.md — E-Commerce Backend

## 專案概述

這是一個 **E-Commerce 電商後端 API 服務**，為 [e-commerce 前端](https://github.com/lawrence565/e-commerce-demo) 提供 REST API。使用 TypeScript + Express + PostgreSQL 技術棧建構，提供商品查詢、購物車管理、訂單處理、使用者 profile、商家管理等功能。

## 技術棧

| 分類 | 技術 |
|------|------|
| 語言 | TypeScript 5.x (target ES2023, ESM / NodeNext) |
| Runtime | Node.js 24.x LTS |
| Web 框架 | Express 4.x |
| 資料庫 | PostgreSQL 15 (透過 `pg` driver) |
| Session | `express-session` (server-side, cookie-based) |
| 容器化 | Docker multi-stage build + Docker Compose |
| 工具管理 | mise (Node.js 版本管理 + task runner) |

## 專案結構

```
e-commerce-backend/
├── src/
│   ├── index.ts              # 應用程式入口：啟動 server
│   ├── app.ts                # Express app、中間件、router mounting
│   ├── server.ts             # HTTP server 啟動與 shutdown
│   ├── config/               # 環境設定
│   ├── db/                   # PostgreSQL client 與 row types
│   ├── routes/               # API route modules
│   ├── schemas/              # Zod request schemas
│   ├── utils/                # mapper / cart / HTTP helpers
│   └── types/
│       ├── domain.ts         # domain types
│       └── express-session.d.ts  # express-session SessionData 型態擴充
├── db/
│   └── init.sql              # 資料庫 schema 與 seed 資料
├── dist/                     # TypeScript 編譯輸出（已 gitignore）
├── Dockerfile                # Multi-stage production build
├── compose.yaml              # Docker Compose (backend + PostgreSQL)
├── package.json              # 專案依賴與 scripts
├── tsconfig.json             # TypeScript 編譯設定
├── mise.toml                 # mise 工具版本與 task 定義
├── coupon.json               # 優惠券靜態資料
├── .gitignore
└── .dockerignore
```

## 架構特點

- **分層 TypeScript 架構**：entry、server、app、routes、schemas、db、types、utils 已拆分。
- **Session-based 狀態管理**：購物車與使用者 profile 存放在 `express-session`，無獨立的 auth 系統。
- **參數化查詢**：所有 SQL 均使用 `$1, $2...` 佔位符防止 SQL injection。
- **型態安全**：`strict: true`，定義了完整的 domain types（CartItem, Order, UserProfile 等）。

## API 結構

| 方法 | 路由 | 說明 |
|------|------|------|
| GET | `/health` | 健康檢查（含 DB ping） |
| GET | `/api/getProduct/:category?/:id?` | 查詢商品（可依分類/ID 篩選） |
| GET/POST/PUT/DELETE | `/api/cart` | 購物車 CRUD |
| DELETE | `/api/carts` | 清空購物車 |
| POST | `/api/order` | 建立訂單 |
| GET | `/api/order/:id` | 查詢單張訂單 |
| GET/PUT | `/api/user/profile` | 取得/更新使用者資料 |
| GET | `/api/user/orders` | 使用者歷史訂單 |
| GET | `/api/merchant/stats` | 商家統計資料 |
| GET/POST/PUT/DELETE | `/api/merchant/products` | 商家商品管理 |
| POST | `/api/analytics/vitals` | 前端 Web Vitals 回傳 |

## 開發指南

### 本機環境設定

```bash
mise install       # 安裝正確版本的 Node.js
mise run install   # npm ci
mise run dev       # 啟動開發伺服器 (tsx watch, port 8080)
```

### Docker 啟動

```bash
docker compose up -d --build   # 啟動 backend + PostgreSQL
curl http://localhost:8080/health
```

### 環境變數

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `PORT` | `8080` | API port |
| `POSTGRES_HOST` | `localhost` | DB host (Docker 內為 `db`) |
| `POSTGRES_PORT` | `5432` | DB port |
| `POSTGRES_DATABASE` / `POSTGRES_DB` | `ecommerce` | DB 名稱 |
| `POSTGRES_USER` | `postgres` | DB 使用者 |
| `POSTGRES_PASSWORD` | `postgres` | DB 密碼 |
| `SESSION_SECRET` | — | Production 模式必填 |
| `CORS_ORIGIN` | `http://localhost:5173` | 允許的前端 origin（逗號分隔） |

## 程式碼規範

- **語言**：TypeScript strict mode，target ES2023
- **模組**：ESM / NodeNext (`type: module`, `module: NodeNext`)
- **型態**：避免 `any`，業務物件需定義明確的 type/interface
- **錯誤處理**：使用統一的 `sendServerError()` 回傳 500 錯誤
- **驗證**：輸入參數使用 type guard 函式驗證（如 `isValidCartItem`, `isValidProductInput`）
- **SQL**：所有查詢必須使用參數化佔位符，禁止字串拼接
- **回應格式**：統一 `{ status: "ok" | "error", data?: ..., message?: ... }`

## 注意事項

- SQL 目前仍在 route handler 裡，未來可再拆 repository / service 層。
- Session 使用記憶體存儲，重啟後資料會遺失；生產環境應考慮使用 Redis 等持久化方案。
- 目前無認證/授權機制，所有 API 均公開存取。
- `coupon.json` 為靜態檔案，目前未被任何程式碼引用。
