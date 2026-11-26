import type { AttributePair } from "@/types/marketplace";

const LABELS: Record<string, string> = {
  storage: "Storage",
  ram: "RAM",
  color: "Color",
  batteryHealth: "Battery Health",
  ptaApproved: "PTA Approved",
  ptaStatus: "PTA Status",
  cpidStatus: "CPID Status",
  model: "Model",
  variant: "Variant",
  networkType: "Network Type",
  carrier: "Carrier",
  isUnlocked: "Unlocked",
  modelNumber: "Model Number",
  region: "Region",
  warranty: "Warranty",
  warrantyExpiry: "Warranty Expiry",
  hasOriginalBox: "Original Box",
  hasCharger: "Charger",
  hasHeadphones: "Headphones",
  repairHistory: "Repair History",
  processor: "Processor / Chipset",
  operatingSystem: "Operating System",
  screenSize: "Screen Size",
  connectivity: "Connectivity",
  accessoryType: "Accessory Type",
  compatibility: "Compatibility",
};

const PTA_STATUS_LABELS: Record<string, string> = {
  PTA_APPROVED: "PTA Approved",
  NON_PTA: "Non-PTA",
  CPID: "CPID",
  FACTORY_UNLOCKED: "Factory Unlocked",
  CARRIER_LOCKED: "Carrier Locked",
  UNKNOWN: "Unknown",
  VERIFICATION_PENDING: "Verification Pending",
};

const CPID_STATUS_LABELS: Record<string, string> = {
  CPID_APPROVED: "CPID Approved",
  NON_CPID: "Non-CPID",
  UNKNOWN: "Unknown",
};

const NETWORK_TYPE_LABELS: Record<string, string> = {
  SINGLE_SIM: "Single SIM",
  DUAL_SIM: "Dual SIM",
  ESIM: "eSIM",
  HYBRID: "Hybrid",
};

const WARRANTY_LABELS: Record<string, string> = {
  NO_WARRANTY: "No Warranty",
  MANUFACTURER: "Manufacturer Warranty",
  SELLER: "Seller Warranty",
  THIRD_PARTY: "Third-Party Warranty",
};

function toTitle(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/** Normalises a listing's `attributes` JSON into display-ready label/value rows. */
export function formatAttributes(attributes: unknown): AttributePair[] {
  if (!attributes || typeof attributes !== "object") return [];

  const pairs: AttributePair[] = [];
  for (const [key, raw] of Object.entries(attributes as Record<string, unknown>)) {
    if (raw === null || raw === undefined || raw === "") continue;

    let value: string;
    if (key === "ptaApproved") value = raw ? "Yes" : "No";
    else if (key === "batteryHealth") value = `${raw}%`;
    else if (key === "ptaStatus") value = PTA_STATUS_LABELS[raw as string] ?? String(raw);
    else if (key === "cpidStatus") value = CPID_STATUS_LABELS[raw as string] ?? String(raw);
    else if (key === "networkType") value = NETWORK_TYPE_LABELS[raw as string] ?? String(raw);
    else if (key === "warranty") value = WARRANTY_LABELS[raw as string] ?? String(raw);
    else if (key === "isUnlocked" || key === "hasOriginalBox" || key === "hasCharger" || key === "hasHeadphones") value = raw ? "Yes" : "No";
    else value = String(raw);

    pairs.push({ label: LABELS[key] ?? toTitle(key), value });
  }
  return pairs;
}
