import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { FundCampaign } from "./FundCampaign";

FundCampaign.implement({
	fields: (t) => ({
		createdAt: t.field({
			description: "Date time at the time the fund campaign was created.",
			resolve: async (parent, _args, ctx) => {
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

						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
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
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
				]);

				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// Fund id existing but the associated fund not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
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

				const currentUserOrganizationMembership =
					existingFund.organization.membershipsWhereOrganization[0];

				if (
					currentUser.role !== "administrator" &&
					(currentUserOrganizationMembership === undefined ||
						currentUserOrganizationMembership.role !== "administrator")
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				return parent.createdAt;
			},
			type: "DateTime",
		}),
	}),
});
