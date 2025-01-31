import type { communitiesTable } from "~/src/drizzle/tables/communities";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { User } from "../User/User";

export type Community = typeof communitiesTable.$inferSelect;

export const Community = builder.objectRef<Community>("Community");

export type CommunityResolvers = {
	updater: (
		parent: Community,
		_args: unknown,
		context: GraphQLContext,
	) => Promise<User | null>;
};

export const CommunityResolver: CommunityResolvers = {
	updater: async (parent, _args, context) => {
		try {
			if (!context.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					message: "User is not authenticated",
					extensions: { code: "unauthenticated" },
				});
			}

			if (!parent.updaterId) {
				return null;
			}

			if (context.currentClient.user.role !== "administrator") {
				throw new TalawaGraphQLError({
					message: "User is not authorized",
					extensions: { code: "unauthorized_action" },
				});
			}
			const updaterId = parent.updaterId;

			const existingUser =
				await context.drizzleClient.query.usersTable.findFirst({
					where: (users, { eq }) => eq(users.id, updaterId), // Must use updaterId here
				});

			if (existingUser === undefined) {
				console.log("No user found for updaterId:", updaterId);
				return null;
			}

			const updater = await context.drizzleClient.query.usersTable.findFirst({
				where: (users, { eq, and, isNull }) =>
					parent.updaterId ? eq(users.id, parent.updaterId) : isNull(users.id),
			});

			return updater ?? null;
		} catch (error) {
			context.log.error("Database error in community updater resolver", {
				error,
			});
			throw error;
		}
	},
};

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
