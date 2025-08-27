import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const mutationReadNotificationInputSchema = z.object({
	notificationIds: z.array(z.string().uuid()).min(1).max(100),
});

export const MutationReadNotificationInput = builder
	.inputRef<z.infer<typeof mutationReadNotificationInputSchema>>(
		"MutationReadNotificationInput",
	)
	.implement({
		description: "Input for marking one or more notifications as read.",
		fields: (t) => ({
			notificationIds: t.field({
				type: ["ID"],
				required: true,
				description: "One or more notification IDs to mark as read.",
			}),
		}),
	});
