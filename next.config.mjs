import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root to THIS project — the parent directory has a
  // stray package-lock.json that confuses Next.js/Netlify root detection.
  outputFileTracingRoot: __dirname,

};

export default nextConfig;
