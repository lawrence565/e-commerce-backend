# 專案架構說明

## 目錄結構

```txt
e-commerce-backend/
├── src/
│   ├── index.ts                  # 程式入口，只負責啟動 server
│   ├── server.ts                 # HTTP server 啟動與 graceful shutdown
│   ├── app.ts                    # Express app、中間件、router mounting
│   ├── config/
│   │   └── env.ts                # 環境變數解析與 runtime 設定
│   ├── db/
│   │   ├── client.ts             # PostgreSQL Pool 與 query helper
│   │   └── rows.ts               # DB row 型態
│   ├── routes/
│   │   ├── analytics.routes.ts
│   │   ├── cart.routes.ts
│   │   ├── health.routes.ts
│   │   ├── merchant.routes.ts
│   │   ├── order.routes.ts
│   │   ├── product.routes.ts
│   │   └── user.routes.ts
│   ├── schemas/
│   │   └── api.schemas.ts        # Zod request schemas
│   ├── types/
│   │   ├── domain.ts             # Domain types
│   │   └── express-session.d.ts  # SessionData declaration merging
│   └── utils/
│       ├── cart.ts
│       ├── http.ts
│       └── mappers.ts
├── db/
│   └── init.sql                  # Schema + seed 商品資料
├── Dockerfile                    # Multi-stage production image
├── compose.yaml                  # backend + PostgreSQL
├── package.json
├── tsconfig.json
└── mise.toml
```

## 執行架構

```txt
React frontend
    │
    │ HTTP / JSON
    ▼
src/app.ts
    │
    ├─ middleware: session, cookies, body parser, CORS
    ├─ routes/*
    │   ├─ schemas/api.schemas.ts  驗證 request body
    │   ├─ db/client.ts            執行參數化 SQL
    │   └─ utils/mappers.ts        DB row → API response
    │
    ▼
PostgreSQL
```

## TypeScript 與模組設計

目前專案已改為現代 Node.js TypeScript 設定：

| 項目 | 設定 |
|------|------|
| Runtime | Node.js 24 LTS |
| Module system | ESM (`"type": "module"`) |
| TypeScript module | `NodeNext` |
| TypeScript strictness | `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `isolatedModules`, `verbatimModuleSyntax` |
| 開發執行 | `tsx watch src/index.ts` |
| Production 執行 | `node dist/index.js` |

ESM + NodeNext 的好處是本機、編譯後 JS、Docker production runtime 使用一致的 Node 模組解析規則。原始碼中的相對 import 使用 `.js` 副檔名，這是 NodeNext 模式下讓 TypeScript 編譯後可直接被 Node 執行的標準做法。

## 責任分層

| 層級 | 目錄 | 職責 |
|------|------|------|
| Entry | `src/index.ts` | 啟動 server |
| Server | `src/server.ts` | listen、signal handling、DB close |
| App | `src/app.ts` | Express app、中間件、router mounting |
| Config | `src/config/` | 環境變數解析與預設值 |
| Routes | `src/routes/` | HTTP endpoint、status code、request/response flow |
| Schemas | `src/schemas/` | Zod request validation |
| DB | `src/db/` | PostgreSQL pool、query helper、row 型態 |
| Domain types | `src/types/domain.ts` | 前後端資料結構與 API response 型態 |
| Utils | `src/utils/` | cart merge、row mapper、HTTP error helpers |

這個分層比原本單一 `src/index.ts` 更容易維護：新增 API 時通常只需要新增 route/schema/type，不必修改整個應用入口。

## API 模組

| 檔案 | Endpoint |
|------|----------|
| `health.routes.ts` | `GET /health` |
| `product.routes.ts` | `GET /api/getProduct/:category?/:id?` |
| `cart.routes.ts` | `GET/POST/PUT/DELETE /api/cart`, `DELETE /api/carts` |
| `order.routes.ts` | `POST /api/order`, `GET /api/order/:id` |
| `user.routes.ts` | `GET/PUT /api/user/profile`, `GET /api/user/orders` |
| `merchant.routes.ts` | `GET /api/merchant/stats`, product CRUD |
| `analytics.routes.ts` | `POST /api/analytics/vitals` |

## Config 評估

目前 config 已符合現代 TypeScript backend 的基礎要求：

- Node 版本由 `mise.toml` 管理，不依賴 nvm。
- `package.json` 使用 ESM，開發用 `tsx`，production 用已編譯的 `dist/`。
- `tsconfig.json` 使用 `NodeNext` 並開啟更嚴格的型別檢查。
- Dockerfile 使用 multi-stage build，只把 production dependencies 與 `dist/` 放進 runner image。
- Compose 使用 DB healthcheck，backend 等 DB healthy 後再啟動。
- Request body 使用 Zod schema 驗證，錯誤由統一 error middleware 處理。

## 仍需補強

目前架構已比 demo 初版清楚，但還不是完整 production backend：

- `express-session` 還是 MemoryStore，正式環境應改 Redis 或 PostgreSQL session store。
- SQL 仍在 route handler 裡，下一步可拆 repository/service 層。
- 沒有 authentication / authorization，merchant routes 目前仍公開。
- 建立訂單仍信任前端傳來的價格，正式電商應由後端查商品並重新計算總金額。
- 付款資料不應直接保存卡號與 CVV，應改由金流 provider token / transaction id。
- `npm test` 目前只做 TypeScript build，應補 API integration tests。
