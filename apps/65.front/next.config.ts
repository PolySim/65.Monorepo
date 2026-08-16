import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "");
const imageUrl = new URL(
  process.env.NEXT_PUBLIC_IMAGE_URL || `${apiUrl}/images`,
);
const imagePath = imageUrl.pathname.replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(dirname, "../../"),
  images: {
    remotePatterns: [
      {
        protocol: imageUrl.protocol.slice(0, -1) as "http" | "https",
        hostname: imageUrl.hostname,
        port: imageUrl.port,
        pathname: imagePath ? `${imagePath}/**` : "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
