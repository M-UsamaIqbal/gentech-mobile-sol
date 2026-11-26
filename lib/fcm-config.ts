import "server-only";

import { env } from "@/lib/env";

/**
 * Firebase Cloud Messaging Configuration
 *
 * These values should be set via server-only environment variables in production.
 * Do not commit real service account keys to version control.
 */
export interface FcmConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/** Load FCM config from environment variables */
export function getFcmConfig(): FcmConfig {
  const projectId = env.FCM_PROJECT_ID;
  const clientEmail = env.FCM_CLIENT_EMAIL;
  const privateKey = env.FCM_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("[FCM] Configuration missing - FCM functionality disabled");
    return {
      projectId: "",
      clientEmail: "",
      privateKey: "",
    };
  }

  // Parse the private key which may have \n escape sequences
  const parsedPrivateKey = privateKey.replace(/\\n/g, "\n");

  return {
    projectId,
    clientEmail,
    privateKey: parsedPrivateKey,
  };
}

export const fcmConfig = getFcmConfig();