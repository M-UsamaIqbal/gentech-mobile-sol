import { z } from "zod";

/** Shared field rules so messages stay consistent across forms. */
const email = z.email({ message: "Enter a valid email address." });
const password = z
  .string()
  .min(8, { message: "Password must be at least 8 characters." })
  .max(128, { message: "Password is too long." });
const name = z
  .string()
  .min(2, { message: "Name must be at least 2 characters." })
  .max(80, { message: "Name is too long." });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { message: "Password is required." }),
  rememberMe: z.boolean().optional(),
});

export const signUpSchema = z
  .object({
    name,
    email,
    password,
    confirmPassword: z.string(),
    region: z.enum(["BAHRAIN", "PAKISTAN"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
