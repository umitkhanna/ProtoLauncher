import mysql from "mysql2/promise";

let pool = null;

/**
 * Shared MySQL pool. Configure via DATABASE_* env vars (see .env.example).
 */
export function getPool() {
  if (pool) return pool;

  const host = process.env.DATABASE_HOST;
  const user = process.env.DATABASE_USER;
  const database = process.env.DATABASE_NAME;

  if (!host || !user || !database) {
    throw new Error(
      "Missing DATABASE_HOST, DATABASE_USER, or DATABASE_NAME environment variables.",
    );
  }

  const options = {
    host,
    user,
    password: process.env.DATABASE_PASSWORD ?? "",
    database,
    waitForConnections: true,
    connectionLimit: Number(process.env.DATABASE_POOL_LIMIT ?? 10),
    maxIdle: Number(process.env.DATABASE_POOL_MAX_IDLE ?? 10),
    idleTimeout: 60_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };

  if (process.env.DATABASE_SSL === "true") {
    options.ssl = { rejectUnauthorized: true };
  }

  pool = mysql.createPool(options);
  return pool;
}
