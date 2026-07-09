import { z } from 'zod';

export const jobSchema = z.object({
  title: z.string()
    .min(3, { message: "Job title must be at least 3 characters long" })
    .max(100, { message: "Job title must not exceed 100 characters" }),
  company: z.string()
    .min(2, { message: "Company name must be at least 2 characters long" })
    .max(100, { message: "Company name must not exceed 100 characters" }),
  description: z.string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .max(5000, { message: "Description must not exceed 5000 characters" }),
  location: z.string()
    .min(2, { message: "Location must be at least 2 characters long" }),
  workplaceType: z.string().min(1, { message: "Please select a workplace type" }),
  type: z.string()
    .min(2, { message: "Please select an opportunity type" }),
  experienceRange: z.string()
    .min(2, { message: "Please select an experience range" }),
  salaryRange: z.string()
    .or(z.literal(''))
    .optional(),
  applyUrl: z
    .url({ message: "Please enter a valid application URL" })
    .or(z.literal(''))
    .optional(),
  industry: z.string()
    .min(2, { message: "Please select an industry" }),
  customIndustry: z.string().optional(),
  skills: z.string().optional(),
  expireAt: z.preprocess(
    (val) => (val === '' || val === undefined ? null : new Date(val as string)),
    z.date().nullable().optional()
  ),
}).refine((data) => {
  if (data.industry === 'Other' && (!data.customIndustry || data.customIndustry.trim().length < 2)) {
    return false;
  }
  return true;
}, {
  message: "Please enter your custom industry (at least 2 characters)",
  path: ["customIndustry"],
});

export type JobSchemaType = z.infer<typeof jobSchema>;
