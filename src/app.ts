import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import session from "express-session";

import { env } from "./config/env.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { cartRouter } from "./routes/cart.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { merchantRouter } from "./routes/merchant.routes.js";
import { orderRouter } from "./routes/order.routes.js";
import { productRouter } from "./routes/product.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { errorHandler, notFoundHandler } from "./utils/http.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(cookieParser(env.cookieSecret));
  app.use(
    session({
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: env.isProduction ? "none" : "lax",
        secure: env.isProduction,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS origin is not allowed: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use("/health", healthRouter);
  app.use("/api", productRouter);
  app.use("/api", cartRouter);
  app.use("/api", orderRouter);
  app.use("/api/user", userRouter);
  app.use("/api/merchant", merchantRouter);
  app.use("/api/analytics", analyticsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
