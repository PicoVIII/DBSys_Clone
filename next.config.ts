import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Ensure Turbopack resolves the correct workspace root (absolute path)
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
