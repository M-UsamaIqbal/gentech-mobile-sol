import type { NextConfig } from "next";

// OpenNext dev shim: makes Cloudflare bindings available when running `next dev`.
// Harmless no-op in production builds.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary-hosted listing media.
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Social avatars from OAuth providers.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
    ],
    // Note: dev-only local uploads are stored as same-origin, root-relative paths
    // (/uploads/...), which next/image serves as local images — no host config needed.
  },
};

export default nextConfig;

// Must be called after the config is defined; enables `getCloudflareContext()` in dev.
void initOpenNextCloudflareForDev();
