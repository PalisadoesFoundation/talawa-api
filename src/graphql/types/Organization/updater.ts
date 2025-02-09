import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Organization } from "./Organization";

/**
 * Resolver to retrieve the user who last updated an organization.
 *
 * This resolver checks if the current user is authenticated and has administrative
 * privileges in the specified organization. It then returns the user who last updated
 * the organization (if applicable). If conditions are not met, an error is thrown.
 *
 * @param {Organization} parent - The parent organization object.
 * @param {Record<string, never>} _args - Unused arguments.
 * @param {Context} ctx - Context object containing authentication info and database client.
 * @returns {Promise<User | null>} - Returns the last updater user if valid, otherwise null.
 * @throws {TalawaGraphQLError} - Throws an error if the user lacks required permissions or the updater ID is invalid.
 */

interface UsersTableQuery<T = UserWithRoles> {
	query: {
		usersTable: {
			findFirst: (params: {
				with?: {
					organizationMembershipsWhereMember?: {
						columns: { role: boolean };
						where: (
							fields: UserOrganizationFields,
							operators: QueryOperators,
						) => { field: string; value: string; operator: "=" };
					};
				};
				where: (
					fields: UserOrganizationFields,
					operators: QueryOperators,
				) => { field: string; value: string; operator: "=" };
			}) => Promise<T | undefined>;
		};
	};
}

interface Log {
	warn: (message: string) => void;
	error: (message: string) => void; // Added error method
	info: (message: string) => void; // Added info method
	debug: (message: string) => void;
}

interface UserOrganizationFields {
	id: string;
	organizationId: string;
	role: string;
}

interface QueryOperators {
	eq: (
		field: "role" | "organizationId" | "id",
		value: string,
	) => {
		field: "role" | "organizationId" | "id";
		value: string;
		operator: "=";
	};
	gt: (
		field: "role" | "organizationId" | "id",
		value: string,
	) => {
		field: "role" | "organizationId" | "id";
		value: string;
		operator: ">";
	};
	lt: (
		field: "role" | "organizationId" | "id",
		value: string,
	) => {
		field: "role" | "organizationId" | "id";
		value: string;
		operator: "<";
	};
	in: (
		field: "role" | "organizationId" | "id",
		values: string[],
	) => {
		field: "role" | "organizationId" | "id";
		values: string[];
		operator: "IN";
	};
}

interface UserOrganizationRole {
	role: "administrator" | "member" | "moderator";
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
	drizzleClient: UsersTableQuery;
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
					columns: { role: true },
					where: (fields, operators) =>
						operators.eq("organizationId", parent.id), // ✅ Explicit field name
				},
			},
			where: (fields, operators) => operators.eq("id", currentUserId), // ✅ Ensure ID is handled correctly
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
			console.debug(`User ${currentUserId} updated their own record.`);
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
							code: "invalid_arguments",
							organizationId: parent.id,
							issues: [
								{
									argumentPath: ["updaterId"],
									message: "updaterId is required but not provided",
								},
							],
						},
					});
				}
				return operators.eq("id", parent.updaterId); // ✅ Explicitly passing "id"
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
