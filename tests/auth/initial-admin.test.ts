import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  lock: vi.fn().mockResolvedValue(undefined),
  count: vi.fn(),
  update: vi.fn().mockResolvedValue({}),
  transaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));

import { Role } from "@/lib/generated/prisma/enums";
import { assignInitialAdminIfNeeded } from "@/features/auth/repositories/initial-role.repository";

describe("assignInitialAdminIfNeeded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.lock.mockResolvedValue(undefined);
    mocks.update.mockResolvedValue({});
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        $executeRaw: mocks.lock,
        user: { count: mocks.count, update: mocks.update },
      }),
    );
  });

  it("promotes the account when no active admin exists", async () => {
    mocks.count.mockResolvedValue(0);

    await expect(assignInitialAdminIfNeeded("user-1")).resolves.toBe(Role.ADMIN);

    expect(mocks.lock).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { role: Role.ADMIN },
    });
  });

  it("leaves the account as USER when an active admin exists", async () => {
    mocks.count.mockResolvedValue(1);

    await expect(assignInitialAdminIfNeeded("user-2")).resolves.toBe(Role.USER);

    expect(mocks.lock).toHaveBeenCalledOnce();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
