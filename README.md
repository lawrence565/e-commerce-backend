# E-Commerce 後端服務

這是配合 [e-commerce 前端](https://github.com/lawrence565/e-commerce-demo) 的後端 API 服務。以 TypeScript + Express + PostgreSQL 建構，提供商品資料、購物車、訂單與商家管理所需的 REST API。

## 功能概覽

| 模組 | 說明 |
|------|------|
| 商品查詢 | 支援全部商品、依分類篩選、依 ID 查詢 |
| 購物車 | 新增 / 更新 / 移除 / 清空，支援 cookie ↔ session 合併 |
| 訂單管理 | 建立訂單、查詢單張訂單、使用者歷史訂單 |
| 使用者 | Mock profile 取得與更新 |
| 商家後台 | 商品 CRUD、銷售統計、近期訂單總覽 |
| Web Vitals | 接收前端效能指標 |

## 技術棧

| 分類 | 技術 |
|------|------|
| 語言 | TypeScript 5.x (strict mode, ES2023, ESM / NodeNext) |
| Runtime | Node.js 24.x LTS |
| Web 框架 | Express 4.x |
| 資料庫 | PostgreSQL 15 (`pg` driver) |
| Session | `express-session` (cookie-based, in-memory store) |
| Schema validation | Zod |
| 容器化 | Docker multi-stage build + Docker Compose |
| 工具管理 | [mise](https://mise.jdx.dev/) |

## 專案結構

```
e-commerce-backend/
├── src/
│   ├── index.ts                  # 程式入口
│   ├── server.ts                 # HTTP server 啟動與 graceful shutdown
│   ├── app.ts                    # Express app / middleware / router mounting
│   ├── config/                   # 環境變數與 runtime 設定
│   ├── db/                       # PostgreSQL pool 與 row types
│   ├── routes/                   # API routes
│   ├── schemas/                  # Zod request schemas
│   ├── utils/                    # mappers / cart / HTTP helpers
│   └── types/
│       ├── domain.ts             # Domain types
│       └── express-session.d.ts  # Session 型態擴充
├── db/
│   └── init.sql                  # Schema 定義 + 36 筆 seed 商品資料
├── docs/
│   └── ARCHITECTURE.md           # 詳細架構說明文件
├── Dockerfile                    # Multi-stage production build
├── compose.yaml                  # Docker Compose (backend + PostgreSQL)
├── package.json                  # 依賴管理
├── tsconfig.json                 # TypeScript 編譯設定
├── mise.toml                     # mise 工具版本 & task runner
└── coupon.json                   # 優惠券靜態資料
```

> 完整架構說明請參考 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Node.js 版本

本專案以 Node.js 最新 LTS 版本線為目標：

- Node.js: `>=24.14.1 <25`
- npm: `>=11`

本機使用 [mise](https://mise.jdx.dev/) 管理 Node.js 版本與 task runner。

## 快速上手

### 本機開發

```bash
mise install       # 安裝指定版本 Node.js
mise run install   # 安裝依賴 (npm ci)
mise run dev       # 啟動開發伺服器 (tsx watch)
```

預設 API 服務會跑在 `http://localhost:8080`。

### Docker 啟動

```bash
# 啟動 backend + PostgreSQL
docker compose up -d --build

# 健康檢查
curl http://localhost:8080/health
```

## 環境變數

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `PORT` | `8080` | API 監聽 port |
| `POSTGRES_HOST` | `localhost` | DB host（Docker Compose 內為 `db`） |
| `POSTGRES_PORT` | `5432` | DB port |
| `POSTGRES_DATABASE` / `POSTGRES_DB` | `ecommerce` | 資料庫名稱 |
| `POSTGRES_USER` | `postgres` | 資料庫使用者 |
| `POSTGRES_PASSWORD` | `postgres` | 資料庫密碼 |
| `SESSION_SECRET` | — | Production 模式**必填** |
| `CORS_ORIGIN` | `http://localhost:5173` | 允許的前端 origin（逗號分隔多個） |

## API 端點

### 商品

```
GET  /api/getProduct                  # 所有商品
GET  /api/getProduct/:category        # 依分類查詢
GET  /api/getProduct/:category/:id    # 依分類 + ID 查詢
```

### 購物車

```
GET     /api/cart        # 取得購物車
POST    /api/cart        # 新增商品
PUT     /api/cart        # 合併 cookie / session cart
PUT     /api/cart/:id    # 更新數量
DELETE  /api/cart/:id    # 移除商品
DELETE  /api/carts       # 清空購物車
```

### 訂單

```
POST  /api/order        # 建立訂單
GET   /api/order/:id    # 查詢訂單
```

### 使用者

```
GET  /api/user/profile    # 取得 profile
PUT  /api/user/profile    # 更新 profile
GET  /api/user/orders     # 歷史訂單
```

### 商家

```
GET     /api/merchant/stats            # 銷售統計
GET     /api/merchant/products         # 所有商品
POST    /api/merchant/products         # 新增商品
PUT     /api/merchant/products/:id     # 更新商品
DELETE  /api/merchant/products/:id     # 刪除商品
```

### 其他

```
GET   /health                  # 健康檢查
POST  /api/analytics/vitals    # Web Vitals 回傳
```

## Docker 部署

Dockerfile 採用 multi-stage build，最小化 production image：

1. **deps** — 安裝完整 dependencies，提供 build 使用
2. **build** — 編譯 TypeScript，產生 `dist/`
3. **runner** — 僅安裝 production dependencies，複製 `dist/`，以非 root 的 `node` 使用者執行

```bash
# 單獨建立 image
docker build -t e-commerce-backend:node24 .
```

## 後續方向

- 🔐 登入驗證與會員系統
- 🔗 使用者與訂單連動，支援會員紅利等功能
- 💳 串接金流工具（藍新、綠界等）
- 🧪 補 API integration tests
- 🧱 進一步拆分 repository / service 層，讓 SQL 與業務流程更清楚

## License

Licensed under the MIT License, Copyright © 2024-present Lawrence Wu
