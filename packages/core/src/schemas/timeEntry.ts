import { z } from "zod";

const timeEntryBaseSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required").max(200),
  startedAt: z.string().datetime({ offset: true }),
  endedAt: z.string().datetime({ offset: true }),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const timeEntryInputSchema = timeEntryBaseSchema.refine(
  (data) => new Date(data.endedAt) > new Date(data.startedAt),
  {
    message: "End time must be after start time",
    path: ["endedAt"],
  },
);

export type TimeEntryInput = z.infer<typeof timeEntryBaseSchema>;

export const timeEntrySchema = timeEntryBaseSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TimeEntry = z.infer<typeof timeEntrySchema>;

export const timeEntryUpdateSchema = timeEntryBaseSchema.partial();

export type TimeEntryUpdate = z.infer<typeof timeEntryUpdateSchema>;
