import { z } from "zod";

const expenseItemSchema = z.object({
  description: z.string().min(1),
  amount: z.coerce.number(),
});

export const saveMonthlyReportSchema = z.object({
  baseId: z.string().min(1, "Base is required"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  openingBalance: z.coerce.number().optional().nullable(),
  income: z.coerce.number().optional().nullable(),
  expenseItems: z.array(expenseItemSchema).optional().default([]),
  theme: z.string().optional().nullable(),
  executiveSummary: z.string().optional().nullable(),
  issues: z.string().optional().nullable(),
  alternativeChurches: z.string().optional().nullable(),
  sundayTeaching: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  victories: z.array(z.string()).optional().default([]),
  challenges: z.array(z.string()).optional().default([]),
  plans: z.array(z.string()).optional().default([]),
  updateOnTeens: z.string().optional().nullable(),
});

export const generateMonthlyReportSchema = z.object({
  baseId: z.string().min(1, "Base is required"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
