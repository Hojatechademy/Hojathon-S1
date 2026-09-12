import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root. Without this, Turbopack walks up and finds a stray
    // package-lock.json in C:\Users\almas and warns about an ambiguous root.
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
