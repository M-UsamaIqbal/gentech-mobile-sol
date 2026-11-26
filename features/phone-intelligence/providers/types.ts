export type PtaStatus = "APPROVED" | "REJECTED" | "PENDING" | "UNKNOWN";
export type CpidStatus = "APPROVED" | "REJECTED" | "UNKNOWN";

/** Provider-neutral result of a PTA/CPID device lookup. */
export interface DeviceVerificationLookup {
  ptaStatus: PtaStatus;
  cpidStatus: CpidStatus;
  isStolen: boolean;
  isBlacklisted: boolean;
  deviceModel: string | null;
  deviceBrand: string | null;
  deviceColor: string | null;
}

export interface DeviceVerificationProvider {
  readonly id: string;
  /** True when results come from the simulator and must be labelled as such. */
  readonly simulated: boolean;
  isConfigured(): boolean;
  verify(imei: string): Promise<DeviceVerificationLookup>;
}
