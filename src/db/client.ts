import { Pool, type QueryResult, type QueryResultRow } from "pg";

import { env } from "../config/env.js";

const pool = new Pool(env.postgres);

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

export async function queryDatabase<T extends QueryResultRow = QueryResultRow>(
  query: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  return pool.query<T>(query, params);
}

export async function closeDatabase() {
  await pool.end();
}
