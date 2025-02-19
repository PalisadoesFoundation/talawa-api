import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const revokeRefreshTokenInputSchema = z.object({
	id: z.string().min(1, "ID is required."),
});

export const RevokeRefreshTokenInput = builder
	.inputRef<z.infer<typeof revokeRefreshTokenInputSchema>>(
		"RevokeRefreshTokenInput",
	)
	.implement({
		description: "Input schema for revoking a user's refresh token.",
		fields: (t) => ({
			id: t.string({
				description: "Unique identifier of the user.",
				required: true,
			}),
		}),
	});
