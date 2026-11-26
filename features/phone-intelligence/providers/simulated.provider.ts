import type {
  CpidStatus,
  DeviceVerificationLookup,
  DeviceVerificationProvider,
  PtaStatus,
} from "./types";

/**
 * Deterministic simulator for the PTA/CPID lookup, used for development and for
 * explicitly enabled test deployments (`DEVICE_VERIFICATION_TEST_MODE=true`).
 *
 * Scenarios are selected by the IMEI's last digit so testers can reproduce every
 * outcome without a provider contract:
 *
 *   0, 1, 9 → PTA APPROVED / CPID APPROVED, clean
 *   2       → PTA PENDING / CPID UNKNOWN
 *   3       → PTA APPROVED / CPID UNKNOWN
 *   4       → PTA REJECTED / CPID APPROVED
 *   5       → PTA APPROVED / CPID APPROVED, blacklisted
 *   6       → PTA APPROVED / CPID APPROVED, reported stolen
 *   7       → PTA UNKNOWN / CPID UNKNOWN
 *   8       → PTA REJECTED / CPID REJECTED
 *
 * Results are always stored with `isSimulated = true` and shown in the UI with a
 * "simulated" banner; they are never presented as real regulatory checks.
 */

const SCENARIOS: Record<
  string,
  { ptaStatus: PtaStatus; cpidStatus: CpidStatus; isStolen: boolean; isBlacklisted: boolean }
> = {
  "0": { ptaStatus: "APPROVED", cpidStatus: "APPROVED", isStolen: false, isBlacklisted: false },
  "1": { ptaStatus: "APPROVED", cpidStatus: "APPROVED", isStolen: false, isBlacklisted: false },
  "2": { ptaStatus: "PENDING", cpidStatus: "UNKNOWN", isStolen: false, isBlacklisted: false },
  "3": { ptaStatus: "APPROVED", cpidStatus: "UNKNOWN", isStolen: false, isBlacklisted: false },
  "4": { ptaStatus: "REJECTED", cpidStatus: "APPROVED", isStolen: false, isBlacklisted: false },
  "5": { ptaStatus: "APPROVED", cpidStatus: "APPROVED", isStolen: false, isBlacklisted: true },
  "6": { ptaStatus: "APPROVED", cpidStatus: "APPROVED", isStolen: true, isBlacklisted: false },
  "7": { ptaStatus: "UNKNOWN", cpidStatus: "UNKNOWN", isStolen: false, isBlacklisted: false },
  "8": { ptaStatus: "REJECTED", cpidStatus: "REJECTED", isStolen: false, isBlacklisted: false },
  "9": { ptaStatus: "APPROVED", cpidStatus: "APPROVED", isStolen: false, isBlacklisted: false },
};

const DEVICES = [
  { brand: "Apple", model: "iPhone 15 Pro", color: "Natural Titanium" },
  { brand: "Samsung", model: "Galaxy S24 Ultra", color: "Titanium Gray" },
  { brand: "Xiaomi", model: "Redmi Note 13 Pro", color: "Midnight Black" },
  { brand: "Infinix", model: "Note 40 Pro", color: "Obsidian Black" },
  { brand: "Tecno", model: "Camon 30", color: "Iceland Basaltic Dark" },
] as const;

export const simulatedDeviceVerificationProvider: DeviceVerificationProvider = {
  id: "simulated",
  simulated: true,

  isConfigured() {
    return true;
  },

  async verify(imei: string): Promise<DeviceVerificationLookup> {
    if (!/^\d{15}$/.test(imei)) {
      throw new Error("IMEI must be exactly 15 digits");
    }

    const lastDigit = imei.at(-1);
    const scenario = lastDigit ? SCENARIOS[lastDigit] : undefined;
    if (!scenario) throw new Error("Unsupported IMEI scenario");

    const device = DEVICES[Number(imei.slice(-2)) % DEVICES.length] ?? DEVICES[0];

    return {
      ...scenario,
      deviceModel: device.model,
      deviceBrand: device.brand,
      deviceColor: device.color,
    };
  },
};
