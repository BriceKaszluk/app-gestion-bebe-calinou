import { z } from "zod";

export const JournalEntrySchema = z.object({
  message: z.string().trim().min(1, "Message requis"),
  babyId: z.string().min(1, "babyId requis"),
});
