import "server-only";

import { env } from "@/lib/env";

// FCM service-account config is server-only and validated by env.ts.
const FCM_PROJECT_ID = env.FCM_PROJECT_ID;
const FCM_CLIENT_EMAIL = env.FCM_CLIENT_EMAIL;
const FCM_PRIVATE_KEY = env.FCM_PRIVATE_KEY;

// FCM configuration interface
export interface FcmConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

interface GoogleApisModule {
  google: {
    auth: {
      JWT: new (
        clientEmail: string | undefined,
        keyFile: undefined,
        privateKey: string | undefined,
        scopes: string[],
      ) => unknown;
    };
    firebasecloudmessaging: (options: {
      version: string;
      auth: unknown;
    }) => {
      projects: {
        messages: {
          send: (request: unknown) => Promise<{ data?: { name?: string } }>;
        };
      };
    };
  };
}

// Lazy-load googleapis to avoid build errors when not installed
let googleApis: GoogleApisModule["google"] | null = null;
async function getGoogleApis() {
  if (googleApis) return googleApis;
  try {
    // @ts-expect-error - googleapis is optional and may not be installed
    const mod: GoogleApisModule = await import(/* turbopackOptional: true */ "googleapis");
    googleApis = mod.google;
    return googleApis;
  } catch {
    return null;
  }
}

/**
 * Check if FCM is configured.
 */
export function isFcmConfigured(): boolean {
  return Boolean(FCM_PROJECT_ID && FCM_CLIENT_EMAIL && FCM_PRIVATE_KEY);
}

/**
 * Send FCM message to a single device.
 */
export async function sendFcmMessage(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isFcmConfigured()) {
    console.log("[FCM:dev] Would send:", params.title, params.body);
    return { success: true, messageId: "dev-simulated" };
  }

  const google = await getGoogleApis();
  if (!google) {
    console.warn("[FCM] googleapis not installed — skipping");
    return { success: false, error: "googleapis not installed" };
  }

  try {
    const auth = new google.auth.JWT(
      FCM_CLIENT_EMAIL,
      undefined,
      FCM_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/firebase.messaging"],
    );

    const firebaseMessaging = google.firebasecloudmessaging({ version: "v1", auth });

    const result = await firebaseMessaging.projects.messages.send({
      parent: `projects/${FCM_PROJECT_ID}`,
      requestBody: {
        message: {
          token: params.token,
          notification: {
            title: params.title,
            body: params.body,
          },
          data: params.data,
        },
      },
    });

    return { success: true, messageId: result.data?.name };
  } catch (error) {
    console.error("[FCM] Send failed:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send FCM message to multiple devices.
 */
export async function sendFcmToMultiple(params: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ success: boolean; successCount: number; failureCount: number }> {
  let successCount = 0;
  let failureCount = 0;

  for (const token of params.tokens) {
    const result = await sendFcmMessage({
      token,
      title: params.title,
      body: params.body,
      data: params.data,
    });
    if (result.success) successCount++;
    else failureCount++;
  }

  return { success: successCount > 0, successCount, failureCount };
}

/**
 * Send FCM message to a topic.
 */
export async function sendFcmToTopic(params: {
  topic: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isFcmConfigured()) {
    console.log("[FCM:dev] Would send to topic:", params.topic, params.title);
    return { success: true, messageId: "dev-simulated" };
  }

  const google = await getGoogleApis();
  if (!google) {
    console.warn("[FCM] googleapis not installed — skipping");
    return { success: false, error: "googleapis not installed" };
  }

  try {
    const auth = new google.auth.JWT(
      FCM_CLIENT_EMAIL,
      undefined,
      FCM_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/firebase.messaging"],
    );

    const firebaseMessaging = google.firebasecloudmessaging({ version: "v1", auth });

    const result = await firebaseMessaging.projects.messages.send({
      parent: `projects/${FCM_PROJECT_ID}`,
      requestBody: {
        message: {
          topic: params.topic,
          notification: {
            title: params.title,
            body: params.body,
          },
          data: params.data,
        },
      },
    });

    return { success: true, messageId: result.data?.name };
  } catch (error) {
    console.error("[FCM] Send to topic failed:", error);
    return { success: false, error: (error as Error).message };
  }
}