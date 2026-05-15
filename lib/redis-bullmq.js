import { Queue } from "bullmq";
import IORedis from "ioredis";

export const REQUIREMENTS_GENERATION_QUEUE = "requirements-generation";

let sharedConnection = null;
let sharedQueue = null;

/**
 * Single shared Redis connection for BullMQ in the Next.js server process.
 */
export function getBullMqConnection() {
  if (sharedConnection) return sharedConnection;

  if (process.env.REDIS_URL) {
    sharedConnection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  } else {
    sharedConnection = new IORedis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });
  }

  return sharedConnection;
}

export function getRequirementsGenerationQueue() {
  if (sharedQueue) return sharedQueue;
  sharedQueue = new Queue(REQUIREMENTS_GENERATION_QUEUE, {
    connection: getBullMqConnection(),
  });
  return sharedQueue;
}

/**
 * Dedicated Redis connection for a BullMQ Worker (separate process).
 * Do not share the Next.js producer connection with a Worker in the same process;
 * in another process this is independent anyway.
 */
export function createWorkerRedisConnection() {
  if (process.env.REDIS_URL) {
    return new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return new IORedis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  });
}

