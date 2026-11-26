import "server-only";

import { env } from "@/lib/env";
import { simulatedDeviceVerificationProvider } from "./simulated.provider";
import type { DeviceVerificationProvider } from "./types";

let warnedAboutTestMode = false;

/**
 * Device-verification provider selection.
 *
 * - A real PTA/CPID adapter must be registered here once provider access is issued;
 *   until then there is no adapter with production credentials.
 * - Outside production the deterministic simulator is used so the flow is testable.
 * - In production the app fails closed (no fabricated statuses) unless the deployment
 *   explicitly opts into `DEVICE_VERIFICATION_TEST_MODE=true` for pre-launch testing.
 */
export function getDeviceVerificationProvider(): DeviceVerificationProvider | null {
  if (process.env.NODE_ENV !== "production") {
    return simulatedDeviceVerificationProvider;
  }

  if (env.DEVICE_VERIFICATION_TEST_MODE === "true") {
    if (!warnedAboutTestMode) {
      warnedAboutTestMode = true;
      console.warn(
        "[device-verification] DEVICE_VERIFICATION_TEST_MODE=true — PTA/CPID results are simulated. Disable this before launch.",
      );
    }
    return simulatedDeviceVerificationProvider;
  }

  return null;
}

export type {
  CpidStatus,
  DeviceVerificationLookup,
  DeviceVerificationProvider,
  PtaStatus,
} from "./types";
