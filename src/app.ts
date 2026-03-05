import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import pinoHttp from "pino-http";

import { config } from "./config";
import { logger } from "./utils/logger";
import routes from "./routes";
import { errorHandler } from "./middlewares/error-handler.middleware";
import { RedisStore } from "connect-redis";
import { redisClient } from "./config/redis";
import { HealthController } from "./controllers/health.controller";
import { setupSwagger } from "./config/swagger";

const app = express();
const isProduction = config.env === "production";

// Root-level health check for orchestrators
app.get("/health", HealthController.check);

// Initialize Swagger API Documentation
setupSwagger(app);

// Trust proxy for rate limiter if behind a reverse proxy
app.set("trust proxy", 1);

// Security Middlewares
app.use(helmet());
app.use(hpp());

// Logging Middleware
app.use(pinoHttp({ logger }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: { status: "error", message: "請求次數過多，請稍後再試" },
});
app.use("/api/", limiter);

// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.cookieSecret));

// CORS
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);

// Session Store with Redis
app.use(
  session({
    store: new RedisStore({
      client: redisClient,
      prefix: "ecommerce:session:",
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours TTL
    },
  })
);

// API Routes
app.use("/api", routes);

// Global Error Handler
app.use(errorHandler);

export default app;
