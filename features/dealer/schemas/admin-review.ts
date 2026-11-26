import { z } from "zod";

export const approveDealerSchema = z.object({
  dealerId: z.string().trim().min(1),
});

export const rejectDealerSchema = z.object({
  dealerId: z.string().trim().min(1),
  reason: z.string().trim().min(5, "Provide a reason of at least 5 characters.").max(500),
});
