import { z } from "zod";

export const RoleEnum = z.enum(["President", "Vice President", "Head", "Member"], {
  errorMap: () => ({ message: "Role must be President, Vice President, Head, or Member" }),
});

export const SocialsSchema = z.object({
  linkedin: z.string().trim().default(""),
  github: z.string().trim().default(""),
  other: z.string().trim().default(""),
});

// Normalization transform helper for student ID
export const normalizeStudentId = (id: string): string => {
  return (id || "").trim().toUpperCase();
};

export const PersonSchema = z.object({
  studentId: z
    .string({ required_error: "Student ID is required" })
    .min(1, "Student ID cannot be empty")
    .transform(normalizeStudentId),
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty"),
  role: RoleEnum,
  team: z.string().trim().default(""),
  bio: z.string().trim().default(""),
  photoUrl: z.string().trim().default(""),
  socials: SocialsSchema.default({}),
  active: z.boolean().default(true),
});

export const PersonCreateInputSchema = PersonSchema;

// Update schema: studentId is stripped or forbidden, never allowed to be modified
export const PersonUpdateInputSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").optional(),
  role: RoleEnum.optional(),
  team: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  photoUrl: z.string().trim().optional(),
  socials: SocialsSchema.partial().optional(),
  active: z.boolean().optional(),
});

export const AdminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type PersonInput = z.infer<typeof PersonSchema>;
export type PersonUpdateInput = z.infer<typeof PersonUpdateInputSchema>;
