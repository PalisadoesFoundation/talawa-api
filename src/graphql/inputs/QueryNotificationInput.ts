import z from "zod";
import { builder } from "~/src/graphql/builder";

export const queryNotificationInputSchema = z.object({
  userId: z.string().uuid(),
  first: z.number().min(1).max(100).optional(),
  skip: z.number().min(0).optional(),
  isRead: z.boolean().optional(),
});

export const QueryNotificationInput = builder
  .inputRef<z.infer<typeof queryNotificationInputSchema>>("QueryNotificationInput")
  .implement({
    description: "Input type for querying notifications for a specific user.",
    fields: (t) => ({
      userId: t.string({
        description: "ID of the user to fetch notifications for.",
        required: true,
      }),
      first: t.int({
        description: "Number of notifications to return (default: 20, max: 100).",
        required: false,
      }),
      skip: t.int({
        description: "Number of notifications to skip for pagination.",
        required: false,
      }),
      isRead: t.boolean({
        description: "Filter by read status (true for read, false for unread).",
        required: false,
      }),
    }),
  });