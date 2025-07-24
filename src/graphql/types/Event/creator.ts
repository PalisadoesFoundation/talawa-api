import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { Event } from "./Event";
import type { Event as EventType } from "./Event";

export const eventCreatorResolver = async (
	parent: EventType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	try {
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
	} catch (error) {
		ctx.log.error(error);
		throw new TalawaGraphQLError({
			message: "Internal server error",
			extensions: {
				code: "unexpected",
			},
		});
	}
};

Event.implement({
	fields: (t) => ({
		creator: t.field({
			description: "User who created the event.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: eventCreatorResolver,
			type: User,
		}),
	}),
});
