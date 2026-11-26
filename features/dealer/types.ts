export interface DealerDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  businessName: string | null;
  businessType: string | null;
  taxNumber: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "ACTIVE" | "SUSPENDED" | "PENDING" | "REJECTED";
  plan: "BASIC" | "PREMIUM" | "ENTERPRISE";
  planExpiresAt: string | null;
  featuredUntil: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  reviewNote: string | null;
  listingCount: number;
  soldCount: number;
  rating: number | null;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DealerApplicationDto extends DealerDto {
  owner: { name: string; email: string } | null;
}

export interface DealerBranchDto {
  id: string;
  dealerId: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DealerInventoryDto {
  id: string;
  dealerId: string;
  listingId: string | null;
  sku: string | null;
  stockCount: number;
  location: string | null;
  costPrice: number | null;
  acquiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealerUserDto {
  id: string;
  dealerId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
}

export interface CreateDealerInput {
  name: string;
  description?: string;
  businessName?: string;
  businessType?: string;
  taxNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateDealerInput {
  name?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  businessName?: string;
  businessType?: string;
  taxNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateBranchInput {
  dealerId: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

export interface DealerLeadDto {
  id: string;
  dealerId: string;
  source: "admin" | "conversation" | "import";
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  associatedListingId?: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  notes?: string;
  assignedTo: "owner" | "manager" | "staff";
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
  convertedToDealerId?: string;
  conversionNotes?: string;
}

export interface CreateDealerLeadInput {
  dealerId: string;
  source: "admin" | "conversation" | "import";
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  associatedListingId?: string;
  status?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  notes?: string;
  assignedTo?: "owner" | "manager" | "staff";
}

export interface UpdateDealerLeadInput {
  leadId: string;
  dealerId: string;
  status: string;
  notes?: string;
}

export interface BulkImportDealerInventoryInput {
  sku: string;
  stockCount: number;
  location?: string;
  costPrice?: number;
  listingId?: string;
}

// Role-based access control
export enum DealerRole {
  OWNER = "owner",
  MANAGER = "manager",
  STAFF = "staff",
}

export enum DealerPermission {
  // Dealer operations
  MANAGE_DEALER = "dealer.manage",
  MANAGE_BRANCH = "branch.manage",
  MANAGE_INVENTORY = "inventory.manage",
  VIEW_DEALER = "dealer.view",
  VIEW_BRANCH = "branch.view",
  VIEW_INVENTORY = "inventory.view",

  // Lead operations
  CREATE_LEAD = "lead.create",
  EDIT_LEAD = "lead.edit",
  CONVERT_LEAD = "lead.convert",
  DELETE_LEAD = "lead.delete",

  // Dealer administration
  APPROVE_DEALER = "admin.approve",
  REJECT_DEALER = "admin.reject",
  MANAGE_DEALERS = "admin.manage",
}

/** Utility to check if a role has a specific permission */
export function hasPermission(role: string, permission: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    [DealerRole.OWNER]: [
      DealerPermission.MANAGE_DEALER,
      DealerPermission.MANAGE_BRANCH,
      DealerPermission.MANAGE_INVENTORY,
      DealerPermission.VIEW_DEALER,
      DealerPermission.VIEW_BRANCH,
      DealerPermission.VIEW_INVENTORY,
      DealerPermission.CREATE_LEAD,
      DealerPermission.EDIT_LEAD,
      DealerPermission.CONVERT_LEAD,
      DealerPermission.DELETE_LEAD,
      DealerPermission.APPROVE_DEALER,
      DealerPermission.REJECT_DEALER,
      DealerPermission.MANAGE_DEALERS,
    ],
    [DealerRole.MANAGER]: [
      DealerPermission.MANAGE_DEALER,
      DealerPermission.VIEW_DEALER,
      DealerPermission.VIEW_BRANCH,
      DealerPermission.VIEW_INVENTORY,
      DealerPermission.CREATE_LEAD,
      DealerPermission.EDIT_LEAD,
      DealerPermission.CONVERT_LEAD,
    ],
    [DealerRole.STAFF]: [
      DealerPermission.VIEW_DEALER,
      DealerPermission.VIEW_BRANCH,
      DealerPermission.VIEW_INVENTORY,
    ],
  };

  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}