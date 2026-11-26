import { render, screen } from "@testing-library/react";
import { Home, ShoppingBag } from "lucide-react";
import { describe, expect, it } from "vitest";

import { MobileQuickActions } from "@/components/layout/mobile-quick-actions";
import { profileInitials } from "@/components/layout/mobile-profile-card";

describe("mobile authenticated shell", () => {
  it("renders app-style quick actions with badges and links", () => {
    render(
      <MobileQuickActions
        label="Dashboard shortcuts"
        actions={[
          { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag, badge: 3 },
          { href: "/", label: "Home", icon: Home },
        ]}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Dashboard shortcuts" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Orders/ })).toHaveAttribute(
      "href",
      "/dashboard/orders",
    );
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("derives profile initials from the signed-in name", () => {
    expect(profileInitials("Ayesha Khan")).toBe("AK");
    expect(profileInitials("")).toBe("U");
  });
});
