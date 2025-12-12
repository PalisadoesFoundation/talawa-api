import { z } from "zod";
import { postsTableInsertSchema } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import {
	FileMetadataInput,
	fileMetadataSchema,
} from "./MutationCreatePostInput";

import { sanitizedStringSchema } from "~/src/utilities/sanitizer";

export const mutationUpdatePostInputSchema = z
	.object({
		/**
		 * Caption of the post.
		 * We persist the raw (trimmed) text and perform HTML escaping at output time
		 * to avoid double-escaping and exceeding DB length limits with escaped entities.
		 */
		caption: postsTableInsertSchema.shape.caption
			.pipe(sanitizedStringSchema)
			.refine((val) => val.length <= 2000, {
				message: "Post caption must not exceed 2000 characters.",
			})
			.optional(),
		id: z.string().uuid(),
		isPinned: z.boolean().optional(),
		attachments: z.array(fileMetadataSchema).min(1).max(20).optional(),
	})
	.refine(
		({ id, ...remainingArg }) =>
			Object.values(remainingArg).some((value) => value !== undefined),
		{ message: "At least one optional argument must be provided." },
	);

export const MutationUpdatePostInput = builder
	.inputRef<z.infer<typeof mutationUpdatePostInputSchema>>(
		"MutationUpdatePostInput",
	)
	.implement({
		description: "Input for updating a post.",
		fields: (t) => ({
			caption: t.string({
				description: "Caption about the post.",
				required: false,
			}),
			id: t.id({
				description: "Global identifier of the post.",
				required: true,
			}),
			isPinned: t.boolean({
				description: "Boolean to tell if the post is pinned",
				required: false,
			}),
			attachments: t.field({
				type: [FileMetadataInput],
				description: "Metadata for files already uploaded via presigned URL",
				required: false,
			}),
		}),
	});
