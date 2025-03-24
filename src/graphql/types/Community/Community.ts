import type { communitiesTable } from "~/src/drizzle/tables/communities";
import { builder } from "~/src/graphql/builder";

export type Community = typeof communitiesTable.$inferSelect;

export const Community = builder.objectRef<Community>("Community");

Community.implement({
	description:
		"Communitys are controlled spaces of collections of users who associate with the purpose those communities exist for.",
	fields: (t) => ({
		createdAt: t.expose("createdAt", {
			description: "Date time at the time the community was created.",
			type: "DateTime",
		}),
		facebookURL: t.exposeString("facebookURL", {
			description: "URL to the facebook account of the community.",
		}),
		githubURL: t.exposeString("githubURL", {
			description: "URL to the gitGub account of the community.",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the community.",
			nullable: false,
		}),
		inactivityTimeoutDuration: t.exposeInt("inactivityTimeoutDuration", {
			description:
				" Duration in seconds it should take for inactive clients to get timed out of their authenticated session within client-side talawa applications.",
		}),
		instagramURL: t.exposeString("instagramURL", {
			description: "URL to the instagram account of the community.",
		}),
		linkedinURL: t.exposeString("linkedinURL", {
			description: "URL to the linkedin account of the community.",
		}),
		logoMimeType: t.exposeString("logoMimeType", {
			description: "Mime type of the avatar of the community.",
		}),
		name: t.exposeString("name", {
			description: "Name of the community.",
		}),
		redditURL: t.exposeString("redditURL", {
			description: "URL to the reddit account of the community.",
		}),
		slackURL: t.exposeString("slackURL", {
			description: "URL to the slack account of the community.",
		}),
		websiteURL: t.exposeString("websiteURL", {
			description: "URL to the website of the community.",
		}),
		xURL: t.exposeString("xURL", {
			description: "URL to the x account of the community.",
		}),
		youtubeURL: t.exposeString("youtubeURL", {
			description: "URL to the youtube account of the community.",
		}),
	}),
});
