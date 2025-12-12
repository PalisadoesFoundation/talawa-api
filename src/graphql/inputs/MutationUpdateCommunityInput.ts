import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { communitiesTableInsertSchema } from "~/src/drizzle/tables/communities";
import { builder } from "~/src/graphql/builder";

export const mutationUpdateCommunityInputSchema = communitiesTableInsertSchema
	.omit({
		createdAt: true,
		id: true,
		logoMimeType: true,
		logoName: true,
		name: true,
		updatedAt: true,
		updaterId: true,
	})
	.extend({
		logo: z.custom<Promise<FileUpload>>().nullish(),
		name: communitiesTableInsertSchema.shape.name.optional(),
	})
	.refine((arg) => Object.values(arg).some((value) => value !== undefined), {
		message: "At least one optional argument must be provided.",
	});

export const MutationUpdateCommunityInput = builder
	.inputRef<z.infer<typeof mutationUpdateCommunityInputSchema>>(
		"MutationUpdateCommunityInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			facebookURL: t.string({
				description: "URL to the facebook account of the community.",
			}),
			githubURL: t.string({
				description: "URL to the gitGub account of the community.",
			}),
			inactivityTimeoutDuration: t.int({
				description:
					"Duration in seconds it should take for inactive clients to get timed out of their authenticated session within client-side talawa applications.",
			}),
			instagramURL: t.string({
				description: "URL to the instagram account of the community.",
			}),
			linkedinURL: t.string({
				description: "URL to the linkedin account of the community.",
			}),
			logo: t.field({
				description: "Mime type of the logo of the community.",
				type: "Upload",
			}),
			name: t.string({
				description: "Name of the community.",
			}),
			redditURL: t.string({
				description: "URL to the reddit account of the community.",
			}),
			slackURL: t.string({
				description: "URL to the slack account of the community.",
			}),
			websiteURL: t.string({
				description: "URL to the website of the community.",
			}),
			xURL: t.string({
				description: "URL to the x account of the community.",
			}),
			youtubeURL: t.string({
				description: "URL to the youtube account of the community.",
			}),
		}),
	});
