import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const repoRoot = dirname(fileURLToPath(import.meta.url));
// Next.js loads .env* from process.cwd(). If the server is started from another
// directory (PM2, Docker WORKDIR, etc.), cwd may not be the repo root and env
// files are skipped. Reload from this config file's directory when they differ.
if (resolve(process.cwd()) !== resolve(repoRoot)) {
  loadEnvConfig(repoRoot, process.env.NODE_ENV !== "production", console, true);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
