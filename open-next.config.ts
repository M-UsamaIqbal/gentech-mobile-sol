import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal config: runs Next.js on Cloudflare Workers with the Node.js runtime.
// No incremental-cache override is set, so ISR/data cache falls back to the
// in-memory default. If/when you want persistent caching, add an R2 or KV
// incremental-cache override here (see OpenNext docs).
export default defineCloudflareConfig();
