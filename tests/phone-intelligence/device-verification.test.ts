import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedEnv = vi.hoisted(() => ({
  env: {} as Record<string, unknown>,
}));

vi.mock("@/lib/env", () => ({ env: mockedEnv.env }));

async function getDeviceVerificationProvider() {
  const providers = await import("@/features/phone-intelligence/providers");
  return providers.getDeviceVerificationProvider();
}

function imeiEndingWith(digit: string): string {
  return `35678901234567${digit}`;
}

describe("device verification provider selection", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mockedEnv.env.DEVICE_VERIFICATION_TEST_MODE = "false";
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("uses the simulator outside production", async () => {
    const provider = await getDeviceVerificationProvider();
    expect(provider?.id).toBe("simulated");
    expect(provider?.simulated).toBe(true);
  });

  it("fails closed in production without a real provider or test mode", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await getDeviceVerificationProvider()).toBeNull();
  });

  it("allows the simulator in production only when DEVICE_VERIFICATION_TEST_MODE=true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockedEnv.env.DEVICE_VERIFICATION_TEST_MODE = "true";
    expect((await getDeviceVerificationProvider())?.id).toBe("simulated");
  });
});

describe("simulated PTA/CPID scenarios", () => {
  it.each([
    ["0", "APPROVED", "APPROVED", false, false],
    ["1", "APPROVED", "APPROVED", false, false],
    ["2", "PENDING", "UNKNOWN", false, false],
    ["3", "APPROVED", "UNKNOWN", false, false],
    ["4", "REJECTED", "APPROVED", false, false],
    ["5", "APPROVED", "APPROVED", false, true],
    ["6", "APPROVED", "APPROVED", true, false],
    ["7", "UNKNOWN", "UNKNOWN", false, false],
    ["8", "REJECTED", "REJECTED", false, false],
    ["9", "APPROVED", "APPROVED", false, false],
  ] as const)(
    "IMEI ending in %s maps to PTA %s / CPID %s",
    async (digit, ptaStatus, cpidStatus, isStolen, isBlacklisted) => {
      const { simulatedDeviceVerificationProvider } = await import(
        "@/features/phone-intelligence/providers/simulated.provider"
      );
      const result = await simulatedDeviceVerificationProvider.verify(imeiEndingWith(digit));

      expect(result.ptaStatus).toBe(ptaStatus);
      expect(result.cpidStatus).toBe(cpidStatus);
      expect(result.isStolen).toBe(isStolen);
      expect(result.isBlacklisted).toBe(isBlacklisted);
      expect(result.deviceBrand).toBeTruthy();
      expect(result.deviceModel).toBeTruthy();
    },
  );

  it("is deterministic for the same IMEI", async () => {
    const { simulatedDeviceVerificationProvider } = await import(
      "@/features/phone-intelligence/providers/simulated.provider"
    );
    const imei = imeiEndingWith("0");

    expect(await simulatedDeviceVerificationProvider.verify(imei)).toEqual(
      await simulatedDeviceVerificationProvider.verify(imei),
    );
  });

  it("rejects a malformed IMEI", async () => {
    const { simulatedDeviceVerificationProvider } = await import(
      "@/features/phone-intelligence/providers/simulated.provider"
    );

    await expect(simulatedDeviceVerificationProvider.verify("12345")).rejects.toThrow(
      "IMEI must be exactly 15 digits",
    );
  });
});
