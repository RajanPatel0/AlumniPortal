import { z } from "zod";

export const startupSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Business name must be at least 3 characters long" })
    .max(100, { message: "Business name must not exceed 100 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .max(2000, { message: "Description must not exceed 2000 characters" }),
  industry: z.string().min(2, { message: "Please select an industry" }),
  customIndustry: z.string().optional(),
  websiteUrl: z
    .url({ message: "Please enter a valid website URL" })
    .or(z.literal(""))
    .optional(),
  logoUrl: z.string().or(z.literal("")).optional(),
  foundedYear: z.number()
    .int()
    .min(1900, { message: "Founded year must be 1900 or later" })
    .max(new Date().getFullYear(), {
      message: "Founded year cannot be in the future",
    })
    .or(z.nan())
    .optional(),
}).refine((data) => {
  if (data.industry === 'Other' && (!data.customIndustry || data.customIndustry.trim().length < 2)) {
    return false;
  }
  return true;
}, {
  message: "Please enter your custom industry (at least 2 characters)",
  path: ["customIndustry"],
});

export type StartupSchemaType = z.infer<typeof startupSchema>;

