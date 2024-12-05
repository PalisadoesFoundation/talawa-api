import { z } from "zod";
import { postsTableInsertSchema } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import {
	CreatePostAttachmentInput,
	createPostAttachmentInputSchema,
} from "./CreatePostAttachmentInput";

export const mutationCreatePostInputSchema = postsTableInsertSchema
	.pick({
		caption: true,
		organizationId: true,
	})
	.extend({
		attachments: createPostAttachmentInputSchema
			.array()
			.min(1)
			.max(20)
			.optional(),
		isPinned: z.boolean().optional(),
	});

export const MutationCreatePostInput = builder
	.inputRef<z.infer<typeof mutationCreatePostInputSchema>>(
		"MutationCreatePostInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			attachments: t.field({
				description: "Attachments of the post.",
				type: t.listRef(CreatePostAttachmentInput),
			}),
			caption: t.string({
				description: "Caption about the post.",
				required: true,
			}),
			isPinned: t.boolean({
				description: "Boolean to tell if the post is pinned",
			}),
			organizationId: t.id({
				description:
					"Global identifier of the associated organization in which the post is posted.",
				required: true,
			}),
		}),
	});
