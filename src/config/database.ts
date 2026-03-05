import { Pool } from "pg";
import { config } from "./index";
import { logger } from "../utils/logger";

// agent:config — Pool settings should be tuned per deployment size
export const db = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
  max: 20, // max number of connection can be open to database
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const connectDb = async () => {
  try {
    const client = await db.connect();
    client.release();
    logger.info("Connected to Postgres database (Pool)");
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
