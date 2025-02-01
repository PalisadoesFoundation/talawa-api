import type { advertisementsTable } from "~/src/drizzle/tables/advertisements";
import { builder } from "~/src/graphql/builder";
import { AdvertisementType } from "~/src/graphql/enums/AdvertisementType";
import {
	AdvertisementAttachment,
	type AdvertisementAttachment as AdvertisementAttachmentType,
} from "~/src/graphql/types/AdvertisementAttachment/AdvertisementAttachment";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type User = {
	id: string;
	isAdmin: boolean;
};

type ContextType = {
	currentClient: {
		isAuthenticated: boolean;
		user: User;
	};
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: (params: { where: { id: string } }) => Promise<User>;
			};
		};
	};
	log: {
		error: (message: unknown) => void;
	};
};

export type Advertisement = typeof advertisementsTable.$inferSelect & {
	attachments: AdvertisementAttachmentType[] | null;
};

export const Advertisement = builder.objectRef<Advertisement>("Advertisement");
export const resolveCreator = async (
	parent: Advertisement,
	_args: Record<string, never>,
	ctx: ContextType,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			message: "User is not authenticated",
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	try {
		// Add null check for creatorId before querying
		if (!parent.creatorId) {
			throw new TalawaGraphQLError({
				message: "Associated creator not found for advertisement",
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: [
						{
							argumentPath: ["creatorId"], // Use argumentPath instead of path
						},
					],
				},
			});
		}

		const user = await ctx.drizzleClient.query.usersTable.findFirst({
			where: { id: parent.creatorId }, // Now guaranteed to be string
		});

		if (!user) {
			ctx.log.error(`User with id ${parent.creatorId} not found`);
			throw new TalawaGraphQLError({
				message: "User not found",
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: [
						{
							argumentPath: ["creatorId"], // Required by the type definition
						},
					],
				},
			});
		}

		if (
			user.id !== ctx.currentClient.user.id &&
			!ctx.currentClient.user.isAdmin
		) {
			throw new TalawaGraphQLError({
				message: "User is not authorized",
				extensions: {
					code: "unauthorized_action",
				},
			});
		}

		return user;
	} catch (error) {
		if (error instanceof TalawaGraphQLError) {
			throw error;
		}
		ctx.log.error(error);
		throw new TalawaGraphQLError({
			message: "Internal server error",
			extensions: {
				code: "unexpected",
			},
		});
	}
};

Advertisement.implement({
	description:
		"Advertisements are a way for an organization to gather funds by advertising them to its members.",
	fields: (t) => ({
		attachments: t.expose("attachments", {
			description: "Array of attachments.",
			type: t.listRef(AdvertisementAttachment),
		}),
		description: t.exposeString("description", {
			description: "Custom information about the advertisement.",
		}),
		endAt: t.expose("endAt", {
			description: "Date time at the time the advertised event ends at.",
			type: "DateTime",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the advertisement.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the advertisement.",
		}),
		startAt: t.expose("startAt", {
			description: "Date time at the time the advertised event starts at.",
			type: "DateTime",
		}),
		type: t.expose("type", {
			description: "Type of the advertisement.",
			type: AdvertisementType,
		}),
	}),
});
