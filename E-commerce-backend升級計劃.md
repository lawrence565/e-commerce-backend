# E-commerce Backend 升級計劃

> 📅 基準日期：2026/03 ｜ 基準分支：`gemini/refactor`
> 🎯 目標：將現有 Express 4 + 單體式架構翻新為**安全、高效能、可擴展、Agent-ready** 的現代後端

---

## 一、現況總結

| 面向 | 現狀 | 風險等級 |
|---|---|---|
| 框架 | Express 4.19 (2024 已進入維護模式) | 🟡 中 |
| 架構 | 331 行單體 `index.ts`，路由/邏輯/DB 全耦合 | 🔴 高 |
| 資安 | 無認證、無驗證、信用卡明碼存 JSONB、弱 secret | 🔴 **極高** |
| 效能 | 單一 `pg.Client`、in-memory session store | 🟡 中 |
| 測試 | 零測試覆蓋率 | 🔴 高 |
| 容器 | 無 multi-stage build、無 `.dockerignore`、無 health check | 🟡 中 |
| 可讀性 | 無 lint/format 設定、混雜編譯後 JS 於 `src/` | 🟡 中 |
| 可觀測性 | 僅 `console.log`，無結構化日誌 | 🟡 中 |

---

## 二、升級路線圖（按優先順序）

### Phase 0 — 基礎工程準備 🏗️

> **目標：** 建立程式碼品質基礎設施，確保後續重構有安全網。

#### 0-1. Linter & Formatter
- 導入 **ESLint v9** (flat config) + **Prettier**
- 設定 `@typescript-eslint/recommended-type-checked` 規則集
- 新增 npm scripts：`lint`、`lint:fix`、`format`
- 新增 `.editorconfig` 確保跨編輯器一致性

#### 0-2. 清理編譯產物
- 刪除 `src/index.js` 與 `src/service/authenticate.service.js`（應只存在於 `dist/`）
- 確認 `.gitignore` 已排除 `dist/`（✅ 已排除）

#### 0-3. 測試框架建立
- 導入 **Vitest**（原生 TypeScript 支援、與 Vite 生態整合）
- 建立 `tests/` 目錄，按 `unit/` / `integration/` / `e2e/` 分類
- 新增 npm scripts：`test`、`test:watch`、`test:coverage`
- 加入 CI-ready 的覆蓋率門檻（初期目標 ≥ 60%）

#### 0-4. Git Hooks
- 使用 **lint-staged** + **Husky** 設定 pre-commit hook
- 在 commit 時自動執行 lint + format check

---

### Phase 1 — 資安強化 🔒

> **目標：** 修復所有高風險與極高風險的安全漏洞。

#### 1-1. 環境安全與 Secret 管理
- 替換弱 secret（`CoolSecret`、`TestingSecret`）為隨機產生的 256-bit 密鑰
- 設定 `.env.example`（含說明、不含實際值），將 `.env` 確認在 `.gitignore`
- 考慮未來遷移至 **HashiCorp Vault** 或 **Docker Secrets** 管理

#### 1-2. 輸入驗證
- 導入 **Zod** 作為 schema 驗證層
- 對所有 API endpoint 的 `req.body`、`req.params`、`req.query` 建立 Zod schema
- 建立統一的驗證 middleware 工廠函式
- 驗證失敗回傳標準化的 `400 Bad Request` 錯誤格式

```typescript
// 預期用法範例 (Agent-friendly comment pattern)
// @schema CartItemInput { productId: number, category: string, quantity: number(min:1) }
app.post("/api/cart", validate(CartItemSchema), cartController.addItem);
```

#### 1-3. 支付資訊安全
- ❌ **立即停止**在 DB 中儲存信用卡卡號與 CVV
- 導入 **第三方支付閘道**（如 Stripe / TapPay / 綠界 ECPay）
- 僅儲存 payment token / transaction ID，不觸碰 PAN
- 遷移 `orders.payment` 欄位結構：

```sql
-- 遷移前 (危險)
payment JSONB  -- { cardNumber: "4111...", securityCode: "123" }

-- 遷移後 (安全)
payment_method TEXT        -- 'credit_card' | 'atm_transfer'
payment_token  TEXT        -- third-party gateway token
payment_status TEXT        -- 'pending' | 'paid' | 'failed'
```

#### 1-4. Security Middleware
- 導入 **helmet** — 設定安全 HTTP headers（CSP、HSTS、X-Frame-Options 等）
- 導入 **express-rate-limit** — API 速率限制（建議：100 req/min/IP）
- 導入 **hpp** — HTTP Parameter Pollution 防護
- 啟用 `cookie.secure: true` + `cookie.sameSite: 'strict'`（生產環境）
- 加入 CORS 動態設定（從環境變數讀取 allowed origins）

```typescript
// agent:config - CORS origins should be configurable per environment
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS?.split(",") ?? ["http://localhost:5173"];
```

#### 1-5. 認證與授權
- 實作 **JWT** 認證（使用 `jose` 套件，不用已停止維護的 `jsonwebtoken`）
- 建立 User model 與 `users` table
- 密碼使用 **Argon2id** 雜湊（取代 bcrypt，更抗 GPU/ASIC 攻擊）
- 建立 RBAC（Role-Based Access Control）中介層：`customer` / `admin`
- 設計 refresh token 機制，token 存於 HTTPOnly cookie

---

### Phase 2 — 架構重構 🏛️

> **目標：** 將單體式 `index.ts` 拆分為分層架構，提升可讀性與可維護性。

#### 2-1. 目錄結構重新設計

```
src/
├── app.ts                    # Express app 設定（middleware、CORS、session）
├── server.ts                 # 啟動入口（listen 邏輯，方便測試時 mock）
├── config/
│   ├── index.ts              # 統一讀取環境變數，附型別與預設值
│   └── database.ts           # DB 連線設定
├── routes/
│   ├── index.ts              # 路由註冊總表
│   ├── product.routes.ts
│   ├── cart.routes.ts
│   └── order.routes.ts
├── controllers/
│   ├── product.controller.ts
│   ├── cart.controller.ts
│   └── order.controller.ts
├── services/
│   ├── product.service.ts
│   ├── cart.service.ts
│   ├── order.service.ts
│   └── auth.service.ts
├── repositories/
│   ├── product.repository.ts # 資料存取層（SQL query 集中管理）
│   └── order.repository.ts
├── middlewares/
│   ├── auth.middleware.ts
│   ├── validate.middleware.ts
│   ├── error-handler.middleware.ts
│   └── rate-limit.middleware.ts
├── schemas/                  # Zod schemas
│   ├── cart.schema.ts
│   ├── order.schema.ts
│   └── product.schema.ts
├── types/
│   ├── express-session.d.ts
│   ├── cart.types.ts
│   ├── order.types.ts
│   └── product.types.ts
├── utils/
│   ├── logger.ts             # 結構化 logger（pino）
│   ├── api-error.ts          # 自定義錯誤類別
│   └── async-handler.ts      # 統一 async error catch wrapper
└── __tests__/                # 或使用頂層 tests/ 目錄
```

#### 2-2. 分層架構原則
- **Route** → **Controller** → **Service** → **Repository** → **DB**
- Controller 只負責 HTTP 層（解析 req、回應 res）
- Service 處理業務邏輯（可脫離 Express 獨立測試）
- Repository 封裝 SQL query（方便未來換 ORM）

#### 2-3. 統一錯誤處理
- 建立 `ApiError` 自訂錯誤類別（含 statusCode、message、isOperational）
- 建立全域 error-handler middleware
- 區分 operational error vs programming error
- 生產環境不洩漏 stack trace

```typescript
// agent:error-handling — All thrown errors should extend ApiError
// for consistent error responses across the API
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}
```

#### 2-4. 結構化日誌
- 導入 **pino**（高效能 JSON logger，比 winston 快 5x）
- 設定 log level 依環境切換（dev: `debug`、prod: `info`）
- 每個 request 自動附加 `requestId`（使用 `crypto.randomUUID()`）
- 日誌包含：timestamp、level、requestId、message、metadata

---

### Phase 3 — 效能優化 ⚡

> **目標：** 消除效能瓶頸，為生產環境做好準備。

#### 3-1. 資料庫連線池
- 將 `pg.Client` 替換為 **`pg.Pool`**
- 設定合理的連線池參數：

```typescript
// agent:config — Pool settings should be tuned per deployment size
const pool = new Pool({
  max: 20,                    // 最大連線數
  idleTimeoutMillis: 30000,   // 閒置超時
  connectionTimeoutMillis: 5000,
});
```

#### 3-2. Session Store 升級
- 將 in-memory session 遷移至 **Redis**（使用 `connect-redis` + `ioredis`）
- 加入 Redis container 至 `compose.yaml`
- 設定 session TTL（建議：24 小時）
- 好處：session 持久化、水平擴展、重啟不遺失

#### 3-3. 快取策略
- 商品列表加入 **Redis 快取**（TTL 5~15 min）
- 使用 Cache-Aside 模式
- 設定 `ETag` / `Cache-Control` response header

#### 3-4. 資料庫索引
- 為 `products.category` 加入 B-tree index
- 為 `orders.order_date` 加入 index（方便查詢排序）
- 考慮 `orders.paid` + `orders.shipped` 複合索引

```sql
CREATE INDEX idx_products_category ON products (category);
CREATE INDEX idx_orders_date ON orders (order_date DESC);
CREATE INDEX idx_orders_status ON orders (paid, shipped);
```

#### 3-5. API 設計改進
- `GET /api/getProduct` → 改為 RESTful 風格 `GET /api/products`
- 加入分頁（`?page=1&limit=20`）
- 加入排序（`?sort=price&order=desc`）
- 回傳標準化分頁 metadata

---

### Phase 4 — 容器化與 DevOps 🐳

> **目標：** 建立生產就緒的 Docker 配置和 CI/CD 流程。

#### 4-1. Dockerfile 改進

```dockerfile
# --- Build Stage ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Production Stage ---
FROM node:22-alpine AS production
RUN apk add --no-cache dumb-init
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:8080/health || exit 1
ENTRYPOINT ["dumb-init", "node", "dist/server.js"]
```

重點改進：
- ✅ **Multi-stage build**（最終 image 不含 TypeScript 原始碼與 devDependencies）
- ✅ **Node 22 Alpine**（更小 image，LTS 至 2027/04）
- ✅ **`npm ci`** 取代 `npm install`（確保可重現的安裝）
- ✅ **Non-root user**（`USER node`，容器安全最佳實踐）
- ✅ **Health check**（供 orchestrator 使用）
- ✅ **`dumb-init`**（正確處理 PID 1 信號轉發）

#### 4-2. `.dockerignore`
```
node_modules
dist
.git
.env
*.md
.DS_Store
.editorconfig
tests
coverage
.vscode
```

#### 4-3. `compose.yaml` 增強
- 加入 **Redis** service
- 加入 **health check** 給每個 service
- 區分 `compose.yaml`（生產）與 `compose.dev.yaml`（開發用 volume mount + hot reload）
- 開發環境使用 **tsx watch** 取代 `npm run build && node dist/`
- 加入 `backend` depends_on 條件：`db: condition: service_healthy`

#### 4-4. Health Check Endpoint
```typescript
// agent:monitoring — Health check endpoint for container orchestration
app.get("/health", async (req, res) => {
  const dbHealthy = await checkDbConnection();
  const redisHealthy = await checkRedisConnection();
  const status = dbHealthy && redisHealthy ? 200 : 503;
  res.status(status).json({
    status: status === 200 ? "healthy" : "unhealthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: { database: dbHealthy, redis: redisHealthy },
  });
});
```

#### 4-5. CI/CD Pipeline（GitHub Actions）
- **PR 觸發**：lint → type-check → test → build
- **Main merge**：build Docker image → push to registry
- 可選：自動化 DB migration（使用 `node-pg-migrate` 或 `prisma migrate`）

---

### Phase 5 — 可觀測性與維運 📊

#### 5-1. 結構化日誌（Phase 2 已涵蓋 pino）
#### 5-2. 錯誤追蹤（可選）
- 整合 **Sentry**（`@sentry/node`），自動捕捉未處理例外
#### 5-3. Metrics（可選）
- 導入 **prom-client** 暴露 Prometheus metrics
- 監控：request latency、error rate、DB pool utilization

---

### Phase 6 — Agent 協作準備 🤖

> **目標：** 在程式碼中留下足夠的結構化資訊，讓 AI Agent 能高效理解與修改此 codebase。

#### 6-1. 註解慣例
在關鍵位置加入 Agent-friendly 結構化註解：

```typescript
// agent:route — POST /api/cart — Adds item to user's cart (requires auth)
// agent:schema — CartItemInput { productId: number, category: string, quantity: number(min:1) }
// agent:config — CORS_ORIGINS: comma-separated allowed origins
// agent:error-handling — All errors extend ApiError for consistent responses
// agent:monitoring — Health check endpoint for container orchestration
// agent:security — Passwords hashed with Argon2id, tokens in HTTPOnly cookies
// agent:todo — [PRIORITY] description of pending work
```

#### 6-2. GEMINI.md 維護
- 每次架構變動時同步更新 `GEMINI.md`
- 確保 API 清單、Types、DB Schema 與程式碼保持一致
- 加入 ADR（Architecture Decision Records）區段記錄重大技術決策

#### 6-3. OpenAPI / Swagger
- 導入 **swagger-jsdoc** + **swagger-ui-express**
- 從 JSDoc 註解自動產生 API 文件
- 讓 Agent 與新開發者能快速理解 API 契約

#### 6-4. 擴充接口預留
- 在 service layer 使用 **dependency injection** 模式（簡易版使用函式參數注入）
- 預留 plugin/hook 機制的接口，方便未來加入新功能模組

---

## 三、已知 Bug 修復清單

| # | Bug 描述 | 檔案 | 修復方式 |
|---|---|---|---|
| 1 | `GET /api/order/:id` 傳入 `req.params`（物件）而非 `req.params.id`（字串） | `src/index.ts:314` | 修正為 `req.params.id` |
| 2 | `DELETE /api/carts` 錯誤時仍回傳 `200` | `src/index.ts:308` | 改為 `500` |
| 3 | `coupon.json` 拼寫錯誤 `expirement` → `expiration` | `coupon.json` | 修正拼寫 |
| 4 | `coupon.json` 資料已過期（2024/10） | `coupon.json` | 更新或移除 |
| 5 | `src/index.js` 不應存在於 `src/` | `src/index.js` | 刪除 |
| 6 | `src/service/authenticate.service.js` 編譯產物不應在 `src/` | `src/service/` | 刪除 |
| 7 | `tsconfig.json` 的 `include` 包含 `dist/index.js`（不合理） | `tsconfig.json:24` | 移除 |

---

## 四、套件升級與新增一覽

### 升級既有套件
| 套件 | 現行版本 | 目標版本 | 備註 |
|---|---|---|---|
| `express` | `^4.19.2` | `^5.1` | Express 5 已於 2025/09 正式發布 |
| `typescript` | `^5.5.4` | `^5.8` | 支援更多型別推斷能力 |
| `pg` | `^8.12.0` | `^8.14` | 改用 `Pool` 取代 `Client` |
| Node.js image | `node:20` | `node:22-alpine` | LTS 至 2027/04，Alpine 縮小 image |
| PostgreSQL image | `postgres:15` | `postgres:17` | 效能改進、新增 JSON 功能 |

### 新增套件
| 套件 | 用途 | 替代方案 |
|---|---|---|
| `zod` | 輸入驗證 | `joi`（但 Zod 更輕量、TS-first） |
| `helmet` | 安全 HTTP headers | — |
| `express-rate-limit` | 速率限制 | — |
| `hpp` | HTTP Parameter Pollution 防護 | — |
| `jose` | JWT 處理（支援 Web Crypto） | `jsonwebtoken`（已停止維護） |
| `argon2` | 密碼雜湊 | `bcrypt`（Argon2 更安全） |
| `pino` + `pino-http` | 結構化日誌 | `winston`（pino 效能更好） |
| `ioredis` + `connect-redis` | Redis client + session store | — |
| `vitest` | 測試框架 | `jest`（Vitest 原生 TS） |
| `supertest` | HTTP 整合測試 | — |
| `eslint` + `prettier` | 程式碼品質 | — |
| `husky` + `lint-staged` | Git hooks | — |
| `tsx` | 開發環境 TS 運行 + watch mode | `ts-node`（tsx 更快） |
| `swagger-jsdoc` + `swagger-ui-express` | API 文件 | — |

---

## 五、資料庫遷移計劃

#### 遷移工具
- 使用 **node-pg-migrate**（輕量、SQL-first、不強制 ORM）

#### 遷移項目
1. 新增 `users` table（含 `password_hash`、`role`、`email`）
2. 修改 `orders` table — 替換 `payment JSONB` 為安全欄位
3. 新增 `products.category` 索引
4. 新增 `orders` 複合索引
5. 新增 `coupons` table（取代靜態 JSON 檔案）

---

## 六、實施建議

1. **嚴格按 Phase 順序進行** — Phase 0~1 為基礎，必須先完成
2. **每個 Phase 開一個 PR** — 方便 review 與回滾
3. **每完成一個 Phase 更新 GEMINI.md** — 保持文件與程式碼同步
4. **優先修復 Bug 清單中的項目** — 可在 Phase 0 一併處理
5. **Phase 5~6 可與其他 Phase 並行** — 不阻斷主線開發
