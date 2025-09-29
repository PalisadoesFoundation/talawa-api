import { type SQL, and, desc, eq, ilike, inArray } from "drizzle-orm";
import { z } from "zod";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { MembershipRequestObject } from "./MembershipRequestObject";
import {
	Organization,
	type Organization as OrganizationType,
} from "./Organization";

const membershipRequestsArgumentsSchema = z
	.object({
		skip: z.number().min(0).optional(),
		first: z.number().min(0).max(50).optional(),
		where: z
			.object({
				user: z
					.object({
						name_contains: z.string().optional(),
						userId: z.string().optional(),
					})
					.optional(),
			})
			.optional(),
	})
	.transform((args) => ({
		skip: args.skip ?? 0,
		first: args.first ?? 10,
		where: args.where,
	}));

const UserWhereInput = builder.inputType("UserWhereInput", {
	fields: (t) => ({
		name_contains: t.string({
			description: "Filter by first name containing this string",
		}),
		userId: t.string({
			description: "Filter by user ID",
		}),
	}),
});

const MembershipRequestWhereInput = builder.inputType(
	"MembershipRequestWhereInput",
	{
		fields: (t) => ({
			user: t.field({
				type: UserWhereInput,
				description: "Filter criteria for user",
			}),
		}),
	},
);

export const membershipRequestsResolver = async (
	parent: OrganizationType,
	args: {
		skip?: number | null;
		first?: number | null;
		where?: {
			user?: {
				name_contains?: string | null;
				userId?: string | null;
			} | null;
		} | null;
	},
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const {
		success,
		error,
		data: parsedArgs,
	} = membershipRequestsArgumentsSchema.safeParse(args);

	if (!success) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "invalid_arguments",
				issues: error.issues.map((issue) => ({
					argumentPath: issue.path,
					message: issue.message,
				})),
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;
	const { skip, first, where } = parsedArgs;
	const name_contains = where?.user?.name_contains;
	const userId = where?.user?.userId;

	const [currentUser, currentUserOrganizationMembership] = await Promise.all([
		ctx.drizzleClient.query.usersTable.findFirst({
			columns: {
				role: true,
			},
			where: (fields, operators) => operators.eq(fields.id, currentUserId),
		}),
		ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
			columns: {
				role: true,
			},
			where: (fields, operators) =>
				operators.and(
					operators.eq(fields.organizationId, parent.id),
					operators.eq(fields.memberId, currentUserId),
				),
		}),
	]);

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	// Check if user is admin (system admin or org admin)
	const isAdmin =
		currentUser.role === "administrator" ||
		(currentUserOrganizationMembership !== undefined &&
			currentUserOrganizationMembership.role === "administrator");

	// If not admin, check if they're querying their own userId
	if (!isAdmin) {
		// Non-admins must provide userId filter that matches their own ID
		if (!userId || userId !== currentUserId) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
					message:
						"Non-admin users can only view their own membership requests by providing their userId in the filter.",
					issues: [{ argumentPath: ["where", "user", "userId"] }],
				},
			});
		}

		// Non-admins cannot use name_contains filter
		if (name_contains) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
					message: "Non-admin users cannot filter membership requests by name.",
					issues: [{ argumentPath: ["where", "user", "name_contains"] }],
				},
			});
		}
	}

	let query: SQL<unknown> = eq(
		membershipRequestsTable.organizationId,
		parent.id,
	);

	if (name_contains) {
		const matchingUsers = await ctx.drizzleClient.query.usersTable.findMany({
			where: (fields) => ilike(fields.name, `%${name_contains}%`),
			columns: { id: true },
		});

		const userIds = matchingUsers.map((user) => user.id);

		if (userIds.length > 0) {
			query = and(
				query,
				inArray(membershipRequestsTable.userId, userIds),
			) as SQL<unknown>;
		} else {
			return [];
		}
	}
	if (userId) {
		query = and(
			query,
			eq(membershipRequestsTable.userId, userId),
		) as SQL<unknown>;
	}

	const membershipRequests =
		await ctx.drizzleClient.query.membershipRequestsTable.findMany({
			where: query,
			limit: first,
			offset: skip,
			orderBy: (fields) => [desc(fields.createdAt)],
			with: { user: true },
		});

	return membershipRequests;
};

// Add membershipRequests field to Organization type
Organization.implement({
	fields: (t) => ({
		membershipRequests: t.field({
			type: [MembershipRequestObject],
			description: "Membership requests for this organization",
			args: {
				skip: t.arg.int({ description: "Number of items to skip" }),
				first: t.arg.int({ description: "Number of items to return" }),
				where: t.arg({
					type: MembershipRequestWhereInput,
					description: "Filter criteria for membership requests",
				}),
			},
			resolve: membershipRequestsResolver,
		}),
	}),
});
