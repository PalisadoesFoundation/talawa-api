import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { FundCampaign } from "./FundCampaign";

/**
 * Resolver for the updatedAt field of FundCampaign type.
 * Validates user authentication and authorization before returning the last update timestamp.
 * Only administrators and organization admins have access to this field.
 *
 * @param parent - The parent FundCampaign object containing the updatedAt field
 * @param args - GraphQL arguments (unused)
 * @param ctx - GraphQL context containing authentication and database clients
 * @returns {Promise<Date>} The timestamp when the fund campaign was last updated
 * @throws {TalawaGraphQLError} With code 'unauthenticated' if user is not logged in
 * @throws {TalawaGraphQLError} With code 'unauthorized_action' if user lacks required permissions
 * @throws {TalawaGraphQLError} With code 'unexpected' for database or other runtime errors
 */

export const updatedAtResolver = async (
	parent: FundCampaign,
	args: unknown,
	ctx: GraphQLContext,
) => {
	try {
		if (!ctx.currentClient.isAuthenticated) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		const currentUserId = ctx.currentClient.user.id;

		const [currentUser, existingFund] = await Promise.all([
			ctx.drizzleClient.query.usersTable.findFirst({
				columns: {
					role: true,
				},
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			}),
			ctx.drizzleClient.query.fundsTable.findFirst({
				columns: {
					isTaxDeductible: true,
				},
				with: {
					organization: {
						columns: {
							countryCode: true,
						},
						with: {
							membershipsWhereOrganization: {
								columns: {
									role: true,
								},
								where: (fields, operators) =>
									operators.eq(fields.memberId, currentUserId),
							},
						},
					},
				},
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			}),
		]);

		if (currentUser === undefined) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		if (existingFund === undefined) {
			ctx.log.error(
				"Postgres select operation returned an empty array for a fund campaign's fund id that isn't null.",
			);

			throw new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			});
		}

		const hasAdminRole =
			existingFund.organization.membershipsWhereOrganization.some(
				(membership) => membership.role === "administrator",
			);

		if (currentUser.role !== "administrator" && !hasAdminRole) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			});
		}

		return parent.updatedAt;
	} catch (error) {
		if (error instanceof TalawaGraphQLError) {
			throw error;
		}

		ctx.log.error("Error in updatedAtResolver:", error);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}
};

FundCampaign.implement({
	fields: (t) => ({
		updatedAt: t.field({
			description: "Date time at the time the fund campaign was last updated.",
			resolve: updatedAtResolver,
			type: "DateTime",
		}),
	}),
});
