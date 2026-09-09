import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  // Pin the workspace root to this project for Docker/Netlify builds.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
