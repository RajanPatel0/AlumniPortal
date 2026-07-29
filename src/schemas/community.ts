import { z } from "zod";
import { CommunityRoleTag } from "@prisma/client";

export const COMMUNITY_CATEGORIES = [
  "General",
  "Tech",
  "Culture",
  "Sports",
  "Research",
] as const;

export const communitySchema = z.object({
  name: z
    .string()
    .min(2, "Community name must be at least 2 characters")
    .max(100, "Community name must not exceed 100 characters"),
  slug: z.string().optional(),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters"),
  logoUrl: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  category: z.string().default("General"),
  campusId: z.string().nullable().optional(),
  externalLinks: z.record(z.string(), z.string()).optional().default({}),
});

export type CommunitySchemaType = z.infer<typeof communitySchema>;

export const memberRoleUpdateSchema = z.object({
  alumniId: z.string().optional(),
  staffId: z.string().optional(),
  roleTag: z.nativeEnum(CommunityRoleTag, {
    message: "Invalid community role tag",
  }),
  customTitle: z.string().nullable().optional(),
});

export type MemberRoleUpdateType = z.infer<typeof memberRoleUpdateSchema>;
