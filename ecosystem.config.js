/**
 * PM2: keep `cwd` at the repo root so Next.js and npm scripts find `.env` / `.env.local`.
 * Usage: pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: "protolauncher-web",
      cwd: __dirname,
      script: "npm",
      args: "run start",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: { NODE_ENV: "production" },
    },
    {
      name: "protolauncher-worker",
      cwd: __dirname,
      script: "npm",
      args: "run worker:requirements",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: { NODE_ENV: "production" },
    },
  ],
};
