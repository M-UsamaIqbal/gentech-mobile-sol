import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AccountForm,
  type AccountFormLabels,
} from "@/app/[country]/[locale]/(dashboard)/account/account-form";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  updateProfileAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/auth-client", () => ({ signOut: vi.fn() }));

vi.mock("@/app/[country]/[locale]/(dashboard)/account/actions", () => ({
  updateProfileAction: mocks.updateProfileAction,
}));

const labels: AccountFormLabels = {
  fullName: "Full name",
  phoneNumber: "Phone number",
  phoneHint: "Buyers contact you here",
  city: "City",
  cityPlaceholder: "e.g. Lahore",
  bio: "Bio",
  bioHint: "Short seller bio",
  personalInfo: "Personal information",
  aboutYou: "About you",
  accountActions: "Account actions",
  editDescription: "Update your details",
  saveChanges: "Save changes",
  saving: "Saving…",
  signOut: "Sign out",
  signingOut: "Signing out…",
  saved: "Profile updated.",
  saveFailed: "Could not save changes.",
  signOutFailed: "Could not sign out.",
};

function renderMobileForm() {
  return render(
    <AccountForm
      variant="mobile"
      name="Ayesha Khan"
      bio="Sells phones"
      phone="+92 300 0000000"
      city="Lahore"
      labels={labels}
    />,
  );
}

describe("mobile account form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders grouped app-style fields with a sticky save action", () => {
    const { container } = renderMobileForm();

    expect(screen.getByRole("heading", { name: "Personal information" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "About you" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Account actions" })).toBeTruthy();
    expect(screen.getByLabelText("Full name")).toHaveValue("Ayesha Khan");
    expect(container.querySelector("[data-mobile-save-bar]")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
  });

  it("updates the live bio character counter", () => {
    renderMobileForm();

    const first = "Mobile seller";
    const second = "Trusted mobile seller in Lahore";

    expect(screen.getByText("12/300")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Bio"), { target: { value: first } });
    expect(screen.getByText(`${first.length}/300`)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Bio"), { target: { value: second } });
    expect(screen.getByText(`${second.length}/300`)).toBeTruthy();
  });
});
