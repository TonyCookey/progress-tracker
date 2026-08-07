import { z } from "zod";
import { optionalDate } from "./parse";

const sharedFields = {
  name: z.string().min(1, "Name is required"),
  gender: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  dateOfBirth: optionalDate(),
  baseId: z.string().min(1).nullable().optional(),
  isCrossBase: z.boolean().optional(),
  date: z.coerce.date(),
  activityId: z.string().min(1).optional().nullable(),
  invitedBy: z.string().optional().nullable(),
  followedUp: z.boolean().optional().default(false),
  becameTeen: z.boolean().optional().default(false),
  teenId: z.string().min(1).optional().nullable(),
  notes: z.string().optional().nullable(),
};

export const createNewConvertSchema = z.object(sharedFields);
export const updateNewConvertSchema = z.object(sharedFields);
