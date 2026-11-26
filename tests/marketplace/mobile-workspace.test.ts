import { describe, expect, it } from "vitest";

import {
  mobileWorkspaceRoute,
  mobileWorkspaceTitleKey,
} from "@/features/marketplace/lib/mobile-workspace";

describe("mobile workspace routing", () => {
  it("strips localized and legacy prefixes", () => {
    expect(mobileWorkspaceRoute("/pk/en/dashboard/orders")).toBe("/dashboard/orders");
    expect(mobileWorkspaceRoute("/bh/ur/messages/123")).toBe("/messages/123");
    expect(mobileWorkspaceRoute("/admin/users")).toBe("/admin/users");
    expect(mobileWorkspaceRoute("/pk/en")).toBe("/");
  });

  it("maps internal sections to stable navigation keys", () => {
    expect(mobileWorkspaceTitleKey("/pk/en/dashboard")).toBe("dashboard");
    expect(mobileWorkspaceTitleKey("/pk/en/dashboard/listings/new")).toBe("myListings");
    expect(mobileWorkspaceTitleKey("/bh/ar/dashboard/orders/ord_1")).toBe("orders");
    expect(mobileWorkspaceTitleKey("/dashboard/saved-searches")).toBe("savedSearches");
    expect(mobileWorkspaceTitleKey("/admin/promotions")).toBe("admin");
    expect(mobileWorkspaceTitleKey("/inspector/insp_1")).toBe("inspector");
    expect(mobileWorkspaceTitleKey("/sell")).toBe("sell");
  });
});
