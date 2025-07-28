import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { Event } from "./Event";

export const eventCreatorResolver = async (
	parent: Event,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	if (parent.creatorId === null) {
		return null;
	}

	const creatorId = parent.creatorId;

	const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, operators) => operators.eq(fields.id, creatorId),
	});

	if (existingUser === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an event's creator id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingUser;
};

Event.implement({
	fields: (t) => ({
		creator: t.field({
			description: "User who created the event.",
			resolve: eventCreatorResolver,
			type: User,
		}),
	}),
});
