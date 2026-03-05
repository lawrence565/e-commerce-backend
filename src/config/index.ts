import dotenv from "dotenv";

dotenv.config();

// agent:config - Centralized environment variables with defaults
export const config = {
  env: process.env.NODE_ENV || "development",
  port:
    process.env.POSTGRES_PORT !== undefined
      ? parseInt(process.env.POSTGRES_PORT, 10)
      : 5432,
  serverPort: process.env.PORT ? parseInt(process.env.PORT, 10) : 8080,
  db: {
    user: process.env.POSTGRES_USER || "your_db_user",
    host: process.env.POSTGRES_HOST || "localhost",
    database: process.env.POSTGRES_DATABASE || "your_db_name",
    password: process.env.POSTGRES_PASSWORD || "your_db_password",
    port:
      process.env.POSTGRES_PORT !== undefined
        ? parseInt(process.env.POSTGRES_PORT, 10)
        : 5432,
  },
  sessionSecret:
    process.env.SESSION_SECRET || "fallback_secret_should_not_be_used",
  cookieSecret: process.env.MYCOOKIESECRET || "fallback_cookie_secret",
  corsOrigins: process.env.CORS_ORIGINS?.split(",") ?? [
    "http://localhost:5173",
  ],
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
};
