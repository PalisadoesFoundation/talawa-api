import { z } from "zod";
import { communitiesTableInsertSchema } from "~/src/drizzle/tables/communities";
import { builder } from "~/src/graphql/builder";
import {
	FileMetadataInput,
	fileMetadataInputSchema,
} from "./FileMetadataInput";

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
		facebookURL: z.string().url().nullable().optional(),
		githubURL: z.string().url().nullable().optional(),
		instagramURL: z.string().url().nullable().optional(),
		linkedinURL: z.string().url().nullable().optional(),
		logo: fileMetadataInputSchema.nullish(),
		name: communitiesTableInsertSchema.shape.name.trim().optional(),
		redditURL: z.string().url().nullable().optional(),
		slackURL: z.string().url().nullable().optional(),
		websiteURL: z.string().url().nullable().optional(),
		xURL: z.string().url().nullable().optional(),
		youtubeURL: z.string().url().nullable().optional(),
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
				required: false,
			}),
			githubURL: t.string({
				description: "URL to the GitHub account of the community.",
				required: false,
			}),
			inactivityTimeoutDuration: t.int({
				description:
					"Duration in seconds it should take for inactive clients to get timed out of their authenticated session within client-side talawa applications.",
			}),
			instagramURL: t.string({
				description: "URL to the instagram account of the community.",
				required: false,
			}),
			linkedinURL: t.string({
				description: "URL to the linkedin account of the community.",
				required: false,
			}),
			logo: t.field({
				description: "Logo of the community.",
				required: false,
				type: FileMetadataInput,
			}),
			name: t.string({
				description: "Name of the community.",
				required: false,
			}),
			redditURL: t.string({
				description: "URL to the reddit account of the community.",
				required: false,
			}),
			slackURL: t.string({
				description: "URL to the slack account of the community.",
				required: false,
			}),
			websiteURL: t.string({
				description: "URL to the website of the community.",
				required: false,
			}),
			xURL: t.string({
				description: "URL to the x account of the community.",
				required: false,
			}),
			youtubeURL: t.string({
				description: "URL to the youtube account of the community.",
				required: false,
			}),
		}),
	});
