import type { GraphQLContext } from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { AgendaCategory as AgendaCategoryType } from "./AgendaCategory";
import { AgendaCategory } from "./AgendaCategory";

// Export the resolver function so it can be tested
export const resolveOrganization = async (
	parent: AgendaCategoryType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}
	const currentUserId = ctx.currentClient.user.id;

	const [currentUser, existingEvent] = await Promise.all([
		ctx.drizzleClient.query.usersTable.findFirst({
			columns: { role: true },
			where: (fields, operators) => operators.eq(fields.id, currentUserId),
		}),
		ctx.drizzleClient.query.eventsTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, parent.eventId),
			with: {
				organization: {
					with: {
						membershipsWhereOrganization: {
							columns: { role: true },
							where: (fields, operators) =>
								operators.eq(fields.memberId, currentUserId),
						},
					},
				},
			},
		}),
	]);

	if (!currentUser) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	if (!existingEvent) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an agenda category event id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});
	}

	const membership = existingEvent.organization.membershipsWhereOrganization[0];

	if (
		currentUser.role !== "administrator" &&
		(!membership || membership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthorized_action" },
		});
	}

	const existingOrganization = await ctx.dataloaders.organization.load(
		parent.organizationId,
	);

	if (existingOrganization === null) {
		ctx.log.error(
			{
				agendaCategoryId: parent.id,
				organizationId: parent.organizationId,
			},
			"DataLoader returned null for an agenda category's organization id that isn't null",
		);

		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});
	}

	return existingOrganization;
};

AgendaCategory.implement({
	fields: (t) => ({
		organization: t.field({
			description: "Organization which the agenda item category belongs to.",
			type: Organization,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveOrganization,
		}),
	}),
});
