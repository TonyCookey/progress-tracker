import { z } from "zod";

export const reportTemplateConfigSchema = z.object({
  sectionsJson: z.record(z.boolean()),
});
