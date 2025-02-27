import { z } from "zod";
import { postsTableInsertSchema } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";

const attachmentSchema = z.object({
	mimeType: z.string(),
	url: z.string(),
});

export const mutationUpdatePostInputSchema = z
	.object({
		caption: postsTableInsertSchema.shape.caption.optional(),
		id: postsTableInsertSchema.shape.id.unwrap(),
		isPinned: z.boolean().optional(),
		attachments: z.array(attachmentSchema).optional(),
	})
	.refine(
		({ id, ...remainingArg }) =>
			Object.values(remainingArg).some((value) => value !== undefined),
		{
			message: "At least one optional argument must be provided.",
		},
	);

const AttachmentInput = builder
	.inputRef<{ mimeType: string; url: string }>("AttachmentInput")
	.implement({
		fields: (t) => ({
			mimeType: t.string({
				required: true,
				description: "Mime type of the attachment.",
			}),
			url: t.string({ required: true, description: "URL of the attachment." }),
		}),
	});

export const MutationUpdatePostInput = builder
	.inputRef<z.infer<typeof mutationUpdatePostInputSchema>>(
		"MutationUpdatePostInput",
	)
	.implement({
		description: "Input for updating a post.",
		fields: (t) => ({
			caption: t.string({
				description: "Caption about the post.",
			}),
			id: t.id({
				description: "Global identifier of the post.",
				required: true,
			}),
			isPinned: t.boolean({
				description: "Boolean to tell if the post is pinned",
			}),
			attachments: t.field({
				type: [AttachmentInput],
				description: "Array of attachments (mimeType and URL).",
			}),
		}),
	});
