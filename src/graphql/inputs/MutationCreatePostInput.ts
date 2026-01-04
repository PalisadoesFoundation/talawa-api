import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { postAttachmentMimeTypeEnum } from "~/src/drizzle/enums/postAttachmentMimeType";
import {
	POST_BODY_MAX_LENGTH,
	POST_CAPTION_MAX_LENGTH,
	postsTableInsertSchema,
} from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import { isNotNullish } from "~/src/utilities/isNotNullish";

export const mutationCreatePostInputSchema = postsTableInsertSchema
	.pick({
		organizationId: true,
	})
	.extend({
		/**
		 * Caption of the post.
		 * We persist the raw (trimmed) text and perform HTML escaping at output time
		 * to avoid double-escaping and exceeding DB length limits with escaped entities.
		 */
		caption: z
			.string()
			.trim()
			.min(1)
			.max(POST_CAPTION_MAX_LENGTH, {
				message: `Post caption must not exceed ${POST_CAPTION_MAX_LENGTH} characters.`,
			}),
		/**
		 * Body of the post.
		 * We persist the raw (trimmed) text and perform HTML escaping at output time
		 * to avoid double-escaping and exceeding DB length limits with escaped entities.
		 */
		body: z
			.string()
			.trim()
			.max(POST_BODY_MAX_LENGTH, {
				message: `Post body must not exceed ${POST_BODY_MAX_LENGTH} characters.`,
			})
			.optional(),
		attachment: z.any().optional(),
		isPinned: z.boolean().optional(),
	})
	.transform(async (arg, ctx) => {
		let attachment:
			| (FileUpload & {
					mimetype: z.infer<typeof postAttachmentMimeTypeEnum>;
			  })
			| null
			| undefined;

		if (isNotNullish(arg.attachment)) {
			const rawAttachment = await arg.attachment;

			if (rawAttachment) {
				const { data, success } = postAttachmentMimeTypeEnum.safeParse(
					rawAttachment.mimetype,
				);

				if (!success) {
					ctx.addIssue({
						code: "custom",
						path: ["attachment"],
						message: `Mime type ${rawAttachment.mimetype} not allowed for attachment upload.`,
					});
					return z.NEVER;
				} else {
					attachment = Object.assign(rawAttachment, {
						mimetype: data,
					});
				}
			}
		} else if (arg.attachment !== undefined) {
			attachment = null;
		}

		return {
			...arg,
			attachment,
		};
	});

export const MutationCreatePostInput = builder.inputType(
	"MutationCreatePostInput",
	{
		description: "Input for creating a new post",
		fields: (t) => ({
			attachment: t.field({
				description: "Direct file upload",
				type: "Upload",
				required: false,
			}),
			caption: t.string({
				description: "Caption about the post.",
				required: true,
			}),
			body: t.string({
				description: "Body content of the post.",
				required: false,
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
	},
);
