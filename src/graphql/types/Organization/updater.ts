import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Organization } from "./Organization";

/**
 * Resolver to update an organization's user.
 *
 * This resolver checks if the current user is authenticated, and if they are an
 * administrator in the given organization. It updates the organization with the
 * specified updater user, or throws an error if the conditions are not met.
 *
 * @param {Organization} parent - The parent organization object being updated.
 * @param {Record<string, never>} _args - Arguments passed to the resolver (currently not used).
 * @param {Context} ctx - The context object containing the authentication info and database client.
 * @returns {Promise<User | null>} - Returns the updated user if the updater ID is valid, otherwise null.
 * @throws {TalawaGraphQLError} - Throws an error if the user is not authenticated, doesn't have the required role,
 * or the updaterId is invalid.
 */

interface DrizzleClientQuery {
	query: {
		usersTable: {
			findFirst: (params: {
				with?: {
					organizationMembershipsWhereMember?: {
						columns: {
							role: boolean;
						};
						where: (
							fields: UserDatabaseRecord,
							operators: QueryOperators,
						) => { field: string; value: string; operator: "=" };
					};
				};
				where: (
					fields: UserDatabaseRecord,
					operators: QueryOperators,
				) => { field: string; value: string; operator: "=" };
			}) => Promise<UserWithRoles | undefined>;
		};
	};
}

interface Log {
	warn: (message: string) => void;
}

interface UserDatabaseRecord {
	id: string;
	organizationId: string;
	role: string;
}

// Updated QueryOperators interface to ensure string-only operations
interface QueryOperators {
	eq: (
		field: string,
		value: string,
	) => {
		field: string;
		value: string;
		operator: "=";
	};
}

interface UserOrganizationRole {
	role: string;
}

interface UserWithRoles extends User {
	organizationMembershipsWhereMember: UserOrganizationRole[];
}

interface Context {
	currentClient: {
		isAuthenticated: boolean;
		user: {
			id: string;
		};
	};
	drizzleClient: DrizzleClientQuery;
	log: Log;
}

export const OrganizationUpdaterResolver = {
	updater: async (
		parent: Organization,
		_args: Record<string, never>,
		ctx: Context,
	): Promise<User | null> => {
		if (!ctx.currentClient.isAuthenticated) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		const currentUserId = ctx.currentClient.user.id;

		const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
			with: {
				organizationMembershipsWhereMember: {
					columns: { role: true }, // Fetch the role for the user within the organization
					where: (fields, operators) =>
						operators.eq(fields.organizationId, parent.id), // Filter by organization ID
				},
			},
			where: (fields, operators) => operators.eq(fields.id, currentUserId), // Ensure it’s the current user
		});
		if (
			!currentUser ||
			!Array.isArray(currentUser.organizationMembershipsWhereMember) ||
			currentUser.organizationMembershipsWhereMember.length === 0
		) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
					message: "User must have at least one organization membership",
				},
			});
		}

		// Check if any of the memberships have the role "administrator"
		const isAdmin = currentUser.organizationMembershipsWhereMember.some(
			(membership) => membership.role === "administrator",
		);

		if (!isAdmin) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			});
		}

		if (parent.updaterId === currentUserId) {
			return currentUser;
		}

		if (!parent.updaterId) {
			return null;
		}

		const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
			where: (fields, operators) => {
				if (parent.updaterId == null) {
					throw new TalawaGraphQLError({
						message: "updaterId is required but not provided",
						extensions: {
							code: "invalid_arguments", // Valid error code
							organizationId: parent.id, // Your custom data
							issues: [
								{
									argumentPath: ["updaterId"], // Correct field name as an array
									message: "updaterId is required but not provided", // Detailed issue message
								},
							],
						},
					});
				}
				return operators.eq(fields.id, parent.updaterId); // No need for non-null assertion
			},
		});

		if (!existingUser) {
			ctx.log.warn(
				`Postgres select operation returned an empty array for organization ${parent.id}'s updaterId (${parent.updaterId}) that isn't null.`,
			);

			throw new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			});
		}

		return existingUser;
	},
};

Organization.implement({
	fields: (t) => ({
		updater: t.field({
			description: "User who last updated the organization.",
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const currentUserId = ctx.currentClient.user.id;

				const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
					with: {
						organizationMembershipsWhereMember: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.organizationId, parent.id),
						},
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				});

				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action",
						},
					});
				}

				const currentUserOrganizationMembership =
					currentUser.organizationMembershipsWhereMember[0];

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

				if (parent.updaterId === null) {
					return null;
				}

				if (parent.updaterId === currentUserId) {
					return currentUser;
				}

				const updaterId = parent.updaterId;

				const existingUser = await ctx.drizzleClient.query.usersTable.findFirst(
					{
						where: (fields, operators) => operators.eq(fields.id, updaterId),
					},
				);

				// Updater id existing but the associated user not existing is either a business logic error which means that the corresponding data in the database is in a corrupted state or it is a rare race condition. It must be investigated and fixed as soon as possible to prevent further data corruption if the former case is true.
				if (existingUser === undefined) {
					ctx.log.warn(
						"Postgres select operation returned an empty array for a organization's updater id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return existingUser;
			},
			type: User,
		}),
	}),
});
