import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Organization } from "./Organization";

// Define types for database fields and operators
interface DatabaseFields {
	id: string;
	organizationId: string;
	role: string;
}

interface DatabaseOperators {
	eq: <T>(field: T, value: T) => boolean;
}

interface OrganizationMembership {
	role: string;
}

interface UserWithMemberships extends User {
	organizationMembershipsWhereMember: OrganizationMembership[];
}

interface Context {
	currentClient: {
		isAuthenticated: boolean;
		user: {
			id: string;
		};
	};
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: (params: {
					with?: {
						organizationMembershipsWhereMember?: {
							columns: {
								role: boolean;
							};
							where: (
								fields: DatabaseFields,
								operators: DatabaseOperators,
							) => boolean;
						};
					};
					where: (
						fields: DatabaseFields,
						operators: DatabaseOperators,
					) => boolean;
				}) => Promise<UserWithMemberships | undefined>;
			};
		};
	};
	log: {
		warn: (message: string) => void;
	};
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
						operators.eq(fields.organizationId, parent.id),
				},
			},
			where: (fields, operators) => operators.eq(fields.id, currentUserId),
		});

		if (!currentUser) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "forbidden_action",
				},
			});
		}

		const currentUserOrganizationMembership =
			currentUser.organizationMembershipsWhereMember[0];

		if (
			!currentUserOrganizationMembership ||
			currentUserOrganizationMembership.role !== "administrator"
		) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			});
		}

		if (!parent.updaterId) {
			return null;
		}

		if (parent.updaterId === currentUserId) {
			return currentUser;
		}

		const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, parent.updaterId),
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
