"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import {
  addBranch,
  addInventory,
  addStaffMember,
  getDealer,
  getUserDealerMembership,
  getUserDealer,
  removeInventory,
  registerDealer,
  removeStaffMember,
  setDealerBranchStatus,
  updateInventory,
  updateDealerProfile,
} from "../services/dealer.service";
import {
  addInventorySchema,
  createBranchSchema,
  createDealerSchema,
  removeInventorySchema,
  updateBranchStatusSchema,
  updateDealerSchema,
  updateInventorySchema,
} from "../schemas/dealer";
import type {
  AddInventoryInput,
  AddStaffInput,
  CreateBranchInput,
  CreateDealerInput,
  UpdateDealerInput,
} from "../schemas/dealer";
import type { DealerDto } from "../types";

type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const SIGN_IN_REQUIRED = "Sign in to access dealer features.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

async function getManageableDealer(
  userId: string,
): Promise<{ dealer: DealerDto } | { error: string }> {
  try {
    const membership = await getUserDealerMembership(userId);
    if (!membership) return { error: "You don't have a dealer profile." };
    if (membership.role !== "owner" && membership.role !== "manager") {
      return { error: "Only dealer owners and managers can change branches or inventory." };
    }
    if (membership.dealer.status !== "ACTIVE" || !membership.dealer.isVerified) {
      return { error: "Dealer operations are available after your account is verified." };
    }
    return { dealer: membership.dealer };
  } catch (error) {
    console.error("[dealer] failed to verify operations access:", error);
    return { error: GENERIC_ERROR };
  }
}

/** Registers a new dealer profile for the current user. */
export async function registerDealerAction(
  input: CreateDealerInput,
): Promise<ActionResult<{ dealerId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = createDealerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join(" ") };
  }

  // Check if user already has a dealer
  const existing = await getUserDealer(user.id);
  if (existing) return { ok: false, error: "You already have a dealer profile." };

  try {
    const dealerId = await registerDealer(parsed.data, user.id);
    revalidatePath(ROUTES.dealers);
    revalidatePath(ROUTES.dealerDashboard);
    return { ok: true, dealerId };
  } catch (error) {
    console.error("[dealer] registerDealer failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Gets the current user's dealer profile if they have one. */
export async function getMyDealerAction(): Promise<ActionResult<{ dealer: DealerDto }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  try {
    const dealer = await getUserDealer(user.id);
    if (!dealer) return { ok: false, error: "You don't have a dealer profile yet." };
    return { ok: true, dealer };
  } catch (error) {
    console.error("[dealer] getMyDealer failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Gets a dealer profile by ID (public view). */
export async function getDealerAction(id: string): Promise<ActionResult<{ dealer: DealerDto }>> {
  try {
    const dealer = await getDealer(id);
    if (!dealer) return { ok: false, error: "Dealer not found." };
    return { ok: true, dealer };
  } catch (error) {
    console.error("[dealer] getDealer failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Updates the current user's dealer profile. */
export async function updateDealerAction(input: UpdateDealerInput) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = updateDealerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join(" ") };
  }

  const dealer = await getUserDealer(user.id);
  if (!dealer) return { ok: false, error: "You don't have a dealer profile." };

  try {
    await updateDealerProfile(dealer.id, parsed.data, dealer.status === "REJECTED");
    if (dealer.status === "REJECTED") {
      revalidatePath(ROUTES.adminDealers);
    }
    revalidatePath(`${ROUTES.dealers}/${dealer.slug}`);
    revalidatePath(ROUTES.dealerDashboard);
    revalidatePath(ROUTES.dealerProfile);
    return { ok: true };
  } catch (error) {
    console.error("[dealer] updateDealer failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Adds a branch to the dealer's business. */
export async function addBranchAction(
  input: CreateBranchInput,
): Promise<ActionResult<{ branchId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = createBranchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid branch details." };
  }

  const access = await getManageableDealer(user.id);
  if ("error" in access) return { ok: false, error: access.error };
  const { dealer } = access;
  if (parsed.data.dealerId !== dealer.id) {
    return { ok: false, error: "You can only add branches to your own dealer profile." };
  }
  try {
    const branchId = await addBranch(parsed.data);
    revalidatePath(`${ROUTES.dealers}/${dealer.slug}`);
    revalidatePath(ROUTES.dealerBranches);
    revalidatePath(ROUTES.dealerDashboard);
    return { ok: true, branchId };
  } catch (error) {
    console.error("[dealer] addBranch failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function setDealerBranchStatusAction(input: {
  branchId: string;
  isActive: boolean;
}): Promise<ActionResult> {
  const parsed = updateBranchStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid branch status request." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const access = await getManageableDealer(user.id);
  if ("error" in access) return { ok: false, error: access.error };
  const { dealer } = access;

  try {
    const updated = await setDealerBranchStatus({ ...parsed.data, dealerId: dealer.id });
    if (!updated) return { ok: false, error: "Branch not found in your dealer account." };
    revalidatePath(ROUTES.dealerBranches);
    revalidatePath(ROUTES.dealerDashboard);
    return { ok: true };
  } catch (error) {
    console.error("[dealer] set branch status failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Adds inventory to the dealer. */
export async function addInventoryAction(
  input: AddInventoryInput,
): Promise<ActionResult<{ inventoryId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = addInventorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid inventory details." };
  }

  const access = await getManageableDealer(user.id);
  if ("error" in access) return { ok: false, error: access.error };
  const { dealer } = access;

  if (parsed.data.dealerId !== dealer.id) {
    return { ok: false, error: "You can only add inventory to your own dealer profile." };
  }
  try {
    const inventoryId = await addInventory(parsed.data);
    revalidatePath(`${ROUTES.dealers}/${dealer.slug}`);
    revalidatePath(ROUTES.dealerInventory);
    revalidatePath(ROUTES.dealerDashboard);
    return { ok: true, inventoryId };
  } catch (error) {
    console.error("[dealer] addInventory failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function updateDealerInventoryAction(input: {
  inventoryId: string;
  stockCount: number;
  location?: string;
}): Promise<ActionResult> {
  const parsed = updateInventorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid inventory details." };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };
  const access = await getManageableDealer(user.id);
  if ("error" in access) return { ok: false, error: access.error };
  const { dealer } = access;

  try {
    const updated = await updateInventory({ ...parsed.data, dealerId: dealer.id });
    if (!updated) return { ok: false, error: "Inventory item not found in your dealer account." };
    revalidatePath(ROUTES.dealerInventory);
    revalidatePath(ROUTES.dealerDashboard);
    return { ok: true };
  } catch (error) {
    console.error("[dealer] update inventory failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function removeDealerInventoryAction(input: {
  inventoryId: string;
}): Promise<ActionResult> {
  const parsed = removeInventorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid inventory item." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };
  const access = await getManageableDealer(user.id);
  if ("error" in access) return { ok: false, error: access.error };
  const { dealer } = access;

  try {
    const removed = await removeInventory({ ...parsed.data, dealerId: dealer.id });
    if (!removed) return { ok: false, error: "Inventory item not found in your dealer account." };
    revalidatePath(ROUTES.dealerInventory);
    revalidatePath(ROUTES.dealerDashboard);
    return { ok: true };
  } catch (error) {
    console.error("[dealer] remove inventory failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Adds a staff member to the dealer. */
export async function addStaffAction(input: AddStaffInput) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const dealer = await getUserDealer(user.id);
  if (!dealer) return { ok: false, error: "You don't have a dealer profile." };

  // Verify the dealer ID matches and user is owner
  if (input.dealerId !== dealer.id) {
    return { ok: false, error: "You can only add staff to your own dealer profile." };
  }

  try {
    await addStaffMember(input.dealerId, input.userId, input.role);
    revalidatePath(`${ROUTES.dealers}/${dealer.slug}`);
    return { ok: true };
  } catch (error) {
    console.error("[dealer] addStaff failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Removes a staff member from the dealer. */
export async function removeStaffAction(dealerId: string, userId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const dealer = await getUserDealer(user.id);
  if (!dealer) return { ok: false, error: "You don't have a dealer profile." };

  // Verify the dealer ID matches
  if (dealerId !== dealer.id) {
    return { ok: false, error: "You can only remove staff from your own dealer profile." };
  }

  try {
    await removeStaffMember(dealerId, userId);
    revalidatePath(`${ROUTES.dealers}/${dealer.slug}`);
    return { ok: true };
  } catch (error) {
    console.error("[dealer] removeStaff failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
