import { Client } from "pg";
import { config } from "./index";
import { logger } from "../utils/logger";

// Create db client (We will upgrade to Pool in Phase 3)
export const db = new Client({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
});

export const connectDb = async () => {
  try {
    await db.connect();
    logger.info("Connected to Postgres database");
  } catch (error) {
    logger.error(error, "Failed to connect to Postgres");
    process.exit(1);
  }
};

// Utility function to handle database queries with error handling
export const queryDatabase = async (query: string, params: unknown[] = []) => {
  try {
    return await db.query(query, params);
  } catch (e) {
    logger.error({ query, params, error: e }, "Database query error");
    throw e; // Let the caller or global error handler deal with it
  }
};
