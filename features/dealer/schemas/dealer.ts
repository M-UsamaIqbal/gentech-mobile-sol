import { z } from "zod";

export const createDealerSchema = z.object({
  name: z.string().trim().min(2, "Dealer name must be at least 2 characters").max(100),
  description: z.string().trim().max(1000).optional(),
  businessName: z.string().trim().max(100).optional(),
  businessType: z.string().trim().max(50).optional(),
  taxNumber: z.string().trim().max(50).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  city: z.string().trim().max(50).optional(),
  address: z.string().trim().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const updateDealerSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  logo: z.string().url().optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
  businessName: z.string().trim().max(100).optional(),
  businessType: z.string().trim().max(50).optional(),
  taxNumber: z.string().trim().max(50).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  city: z.string().trim().max(50).optional(),
  address: z.string().trim().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const dealerFormSchema = createDealerSchema.extend({
  logo: updateDealerSchema.shape.logo,
  coverImage: updateDealerSchema.shape.coverImage,
});

export const createBranchSchema = z.object({
  dealerId: z.string().min(1, "Dealer ID is required"),
  name: z.string().trim().min(2, "Branch name must be at least 2 characters").max(100),
  address: z.string().trim().min(5, "Address is required").max(200),
  city: z.string().trim().min(2, "City is required").max(50),
  phone: z.string().trim().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const addInventorySchema = z.object({
  dealerId: z.string().min(1, "Dealer ID is required"),
  listingId: z.string().trim().min(1).optional().or(z.literal("")),
  sku: z.string().trim().min(1).max(50).optional().or(z.literal("")),
  stockCount: z.number().int().min(1, "Stock count must be at least 1"),
  location: z.string().trim().max(100).optional().or(z.literal("")),
  costPrice: z.number().positive("Cost price must be positive").optional(),
});

export const updateBranchStatusSchema = z.object({
  branchId: z.string().trim().min(1),
  isActive: z.boolean(),
});

export const updateInventorySchema = z.object({
  inventoryId: z.string().trim().min(1),
  stockCount: z.number().int().min(0).max(100000),
  location: z.string().trim().max(100).optional().or(z.literal("")),
});

export const removeInventorySchema = z.object({
  inventoryId: z.string().trim().min(1),
});

export const addStaffSchema = z.object({
  dealerId: z.string().min(1, "Dealer ID is required"),
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["owner", "manager", "staff"]).default("staff"),
});

export type CreateDealerInput = z.infer<typeof createDealerSchema>;
export type UpdateDealerInput = z.infer<typeof updateDealerSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type AddInventoryInput = z.infer<typeof addInventorySchema>;
export type UpdateBranchStatusInput = z.infer<typeof updateBranchStatusSchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type AddStaffInput = z.infer<typeof addStaffSchema>;
