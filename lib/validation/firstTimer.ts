import { z } from "zod";
import { optionalDate } from "./parse";

// Optional free-text field from a form: "" is treated as unset.
const optionalText = () => z.preprocess((v) => (v === "" ? null : v), z.string().trim().optional().nullable());

const sharedFields = {
  name: z.string().trim().min(1, "Name is required"),
  gender: optionalText(),
  phone: optionalText(),
  email: z.preprocess((v) => (v === "" ? null : v), z.string().trim().email("Invalid email").optional().nullable()),
  address: optionalText(),
  dateOfBirth: optionalDate(),
  school: optionalText(),
  guardianName: optionalText(),
  guardianPhone: optionalText(),
  baseId: z.string().min(1, "Base is required"),
  visitDate: z.coerce.date(),
  invitedBy: optionalText(),
  howHeard: optionalText(),
  followedUp: z.boolean().optional().default(false),
  returned: z.boolean().optional().default(false),
  notes: optionalText(),
};

export const createFirstTimerSchema = z.object(sharedFields);
export const updateFirstTimerSchema = z.object(sharedFields);
