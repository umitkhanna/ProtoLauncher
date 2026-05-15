import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processRequirementsGenerationJob } from "./process-requirements-job.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const queueApiRoot = path.join(__dirname, "..");
const repoRoot = path.join(__dirname, "..", "..");
dotenv.config({ path: path.join(repoRoot, ".env.local") });
dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(queueApiRoot, ".env") });

export const REQUIREMENTS_GENERATION_QUEUE = "requirements-generation";

/** BullMQ expects connection options (or URL string) so it can open multiple Redis clients internally. */
function getBullMqConnection() {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  };
}

function createProbeRedis() {
  const opts = getBullMqConnection();
  if (typeof opts === "string") {
    return new IORedis(opts, { maxRetriesPerRequest: null });
  }
  return new IORedis({ ...opts });
}

function assertDatabaseEnv() {
  const host = process.env.DATABASE_HOST;
  const user = process.env.DATABASE_USER;
  const database = process.env.DATABASE_NAME;
  if (!host || !user || !database) {
    console.error(
      "[queue-api] Missing DATABASE_HOST, DATABASE_USER, or DATABASE_NAME.",
    );
    console.error(
      "  Set them in queue-api/.env or repo .env.local, or run: npm run worker:env (from repo root)",
    );
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("[queue-api] unhandledRejection", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[queue-api] uncaughtException", err);
});

async function probeRedis() {
  const redis = createProbeRedis();
  redis.on("error", (err) => {
    console.error("[queue-api] Redis connection error:", err.message);
  });
  try {
    const pong = await Promise.race([
      redis.ping(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis ping timed out after 8s")), 8000),
      ),
    ]);
    const connInfo = process.env.REDIS_URL
      ? "REDIS_URL"
      : `host=${process.env.REDIS_HOST || "127.0.0.1"} port=${process.env.REDIS_PORT || 6379}`;
    console.log("[queue-api] Redis:", pong, `(${connInfo})`);
  } finally {
    await redis.quit().catch(() => {});
  }
}

async function probeMysql() {
  const { getPool } = await import("./db.js");
  const pool = getPool();
  await pool.query("SELECT 1 AS ok");
  console.log("[queue-api] MySQL: ok", `(host=${process.env.DATABASE_HOST}, db=${process.env.DATABASE_NAME})`);
}

async function main() {
  console.log("[queue-api] starting worker…");
  console.log(
    "[queue-api] env:",
    `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY ? `set (${process.env.ANTHROPIC_API_KEY.length} chars)` : "not set"}`,
    `OPENAI_API_KEY=${process.env.OPENAI_API_KEY ? `set (${process.env.OPENAI_API_KEY.length} chars)` : "not set"}`,
  );

  assertDatabaseEnv();

  await probeRedis();
  await probeMysql();

  const connection = getBullMqConnection();

  const worker = new Worker(
    REQUIREMENTS_GENERATION_QUEUE,
    async (job) => {
      console.log(
        `[queue-api] processing job ${job.id} userId=${job.data?.userId} projectId=${job.data?.projectId}`,
      );
      const { userId, projectId } = job.data;
      if (!userId || !projectId) {
        throw new Error("Invalid job payload");
      }
      await processRequirementsGenerationJob({
        userId: Number(userId),
        projectId: Number(projectId),
      });
    },
    { connection },
  );

  worker.on("completed", (job) => {
    console.log(`[queue-api] completed job ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[queue-api] FAILED job ${job?.id}`, err?.message || err);
    if (err?.stack) console.error(err.stack);
  });

  worker.on("error", (err) => {
    console.error("[queue-api] worker error:", err?.message || err);
  });

  worker.on("active", (job) => {
    console.log(`[queue-api] job active: ${job.id}`);
  });

  worker.on("stalled", (jobId) => {
    console.warn("[queue-api] stalled job:", jobId);
  });

  await worker.waitUntilReady();
  console.log(
    `[queue-api] listening on queue "${REQUIREMENTS_GENERATION_QUEUE}" — Redis + MySQL OK`,
  );
}

main().catch((err) => {
  console.error("[queue-api] startup failed:", err?.message || err);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
