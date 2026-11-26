import type { MetadataRoute } from "next";

import { APP_URL } from "@/lib/app-url";
import { buildRobotsConfig } from "@/lib/seo/robots";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsConfig(APP_URL);
}
