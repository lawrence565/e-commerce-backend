import dotenv from "dotenv";

dotenv.config();

function parseInteger(value: string | undefined, fallback: number) {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Invalid integer environment value: ${value}`);
  }

  return parsed;
}

function parseOrigins(value: string | undefined) {
  return (value ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && !sessionSecret) {
  throw new Error("SESSION_SECRET is required when NODE_ENV=production");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction,
  port: parseInteger(process.env.PORT, 8080),
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  cookieSecret: process.env.MYCOOKIESECRET,
  sessionSecret: sessionSecret ?? "local-development-session-secret",
  postgres: {
    user: process.env.POSTGRES_USER ?? "postgres",
    host: process.env.POSTGRES_HOST ?? "localhost",
    database:
      process.env.POSTGRES_DATABASE ?? process.env.POSTGRES_DB ?? "ecommerce",
    password: process.env.POSTGRES_PASSWORD ?? "postgres",
    port: parseInteger(process.env.POSTGRES_PORT, 5432),
  },
} as const;
