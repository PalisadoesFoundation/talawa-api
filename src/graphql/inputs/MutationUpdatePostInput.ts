import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { postAttachmentMimeTypeZodEnum } from "~/src/drizzle/enums/postAttachmentMimeType";
import {
	POST_BODY_MAX_LENGTH,
	POST_CAPTION_MAX_LENGTH,
} from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import { isNotNullish } from "~/src/utilities/isNotNullish";

export const mutationUpdatePostInputSchema = z
	.object({
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
			})
			.optional(),
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
		id: z.string().uuid(),
		isPinned: z.boolean().optional(),
		attachment: z.any().optional(),
	})
	.transform(async (arg, ctx) => {
		let attachment:
			| (FileUpload & {
					mimetype: z.infer<typeof postAttachmentMimeTypeZodEnum>;
			  })
			| null
			| undefined;

		if (isNotNullish(arg.attachment)) {
			const rawAttachment = await arg.attachment;

			if (rawAttachment) {
				const { data, success } = postAttachmentMimeTypeZodEnum.safeParse(
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
	})
	.refine(
		({ id, ...remainingArg }) =>
			Object.values(remainingArg).some((value) => value !== undefined),
		{ message: "At least one optional argument must be provided." },
	);

export const MutationUpdatePostInput = builder.inputType(
	"MutationUpdatePostInput",
	{
		description: "Input for updating a post.",
		fields: (t) => ({
			caption: t.string({
				description: "Caption about the post.",
				required: false,
			}),
			body: t.string({
				description: "Body content of the post.",
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
			attachment: t.field({
				type: "Upload",
				description: "Direct file upload",
				required: false,
			}),
		}),
	},
);
