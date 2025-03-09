import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const mutationCreateGetfileUrlInputSchema = z.object({
	organizationId: z.string(),
	objectName: z.string().optional(),
});

export const MutationCreateGetfileUrlInput = builder
	.inputRef<z.infer<typeof mutationCreateGetfileUrlInputSchema>>(
		"MutationCreateGetfileUrlInput",
	)
	.implement({
		description: "Input for getting a presigned URL for file download",
		fields: (t) => ({
			organizationId: t.id({
				description: "ID of the organization the file belongs to",
				required: true,
			}),
			objectName: t.string({
				description: "Name of the object to be downloaded",
				required: false,
			}),
		}),
	});
