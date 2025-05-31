import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { volunteerGroupsTable } from "~/src/drizzle/tables/volunteerGroups";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import {
	MutationUpdateEvenVolunteerGrouptInput,
	mutationUpdateEventVolunteerGroupInputSchema,
} from "../../inputs/MutationUpdateEventVolunteerGroupInput";
import { VolunteerGroups } from "../VolunteerGroups/VolunteerGroups";
const mutationUpdateEventVolunteerGroupArgumentsSchema = z.object({
	input: mutationUpdateEventVolunteerGroupInputSchema,
});

builder.mutationField("updateEventVolunteerGroup", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateEvenVolunteerGrouptInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update a volunteer group.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = mutationUpdateEventVolunteerGroupArgumentsSchema.safeParse(args);

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

			//   const { id } = parsedArgs.input;
			//   if (!id) {
			//     throw new Error("VolunteerGroup ID is required");
			//   }

			//   const existingGroup =
			//     await ctx.drizzleClient.query.volunteerGroupsTable.findFirst({
			//       columns: {
			//         eventId: true,
			//         creatorId: true,
			//       },
			//       where: (fields, operators) => operators.eq(fields.id, id), // parent is the VolunteerGroup
			//     });

			//   if (existingGroup === undefined) {
			//     throw new TalawaGraphQLError({
			//       extensions: {
			//         code: "arguments_associated_resources_not_found",
			//         issues: [
			//           {
			//             argumentPath: ["input", "groupId"],
			//           },
			//         ],
			//       },
			//     });
			//   }

			//   const existingEvent = await ctx.drizzleClient.query.eventsTable.findFirst(
			//     {
			//       columns: {
			//         organizationId: true,
			//         creatorId: true,
			//       },
			//       where: (fields, operators) =>
			//         operators.eq(fields.id, existingGroup?.eventId), // parent is the VolunteerGroup
			//     }
			//   );

			//   if (existingEvent === undefined) {
			//     throw new TalawaGraphQLError({
			//       extensions: {
			//         code: "arguments_associated_resources_not_found",
			//         issues: [
			//           {
			//             argumentPath: ["input", "eventId"],
			//           },
			//         ],
			//       },
			//     });
			//   }

			//   const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
			//     with: {
			//       organizationMembershipsWhereMember: {
			//         columns: {
			//           role: true,
			//         },
			//         where: (fields, operators) =>
			//           operators.eq(fields.organizationId, existingEvent.organizationId),
			//       },
			//     },
			//     where: (fields, operators) => operators.eq(fields.id, currentUserId),
			//   });

			//   if (currentUser === undefined) {
			//     throw new TalawaGraphQLError({
			//       extensions: {
			//         code: "unauthenticated",
			//       },
			//     });
			//   }
			//   const currentUserOrganizationMembership =
			//     currentUser.organizationMembershipsWhereMember[0];

			//   if (
			//     currentUser.role !== "administrator" &&
			//     currentUserOrganizationMembership?.role !== "administrator" &&
			//     currentUserId !== existingGroup.creatorId
			//   ) {
			//     throw new TalawaGraphQLError({
			//       extensions: {
			//         code: "unauthorized_action_on_arguments_associated_resources",
			//         issues: [
			//           {
			//             argumentPath: ["input", "id"],
			//           },
			//         ],
			//       },
			//     });
			//   }

			const volunteerGroupWithEventAndUser = await ctx.drizzleClient
				.select({
					volunteerGroup: volunteerGroupsTable,
					eventOrganizationId: eventsTable.organizationId,
					eventCreatorId: eventsTable.creatorId,
					organizationMembershipRole: organizationMembershipsTable.role,
				})
				.from(volunteerGroupsTable)
				.leftJoin(eventsTable, eq(volunteerGroupsTable.eventId, eventsTable.id))
				.leftJoin(
					organizationMembershipsTable,
					and(
						eq(
							organizationMembershipsTable.organizationId,
							eventsTable.organizationId,
						),
						eq(organizationMembershipsTable.memberId, currentUserId),
					),
				)
				.where(eq(volunteerGroupsTable.id, parsedArgs.input.id))
				.execute();

			if (
				!volunteerGroupWithEventAndUser ||
				volunteerGroupWithEventAndUser.length === 0
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "groupId"] }],
					},
				});
			}

			const result = volunteerGroupWithEventAndUser[0]!;

			if (!result.eventOrganizationId) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "eventId"] }],
					},
				});
			}

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: { role: true },
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (
				currentUser?.role !== "administrator" &&
				result.organizationMembershipRole !== "administrator" &&
				currentUserId !== result.volunteerGroup.creatorId
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["input", "id"] }],
					},
				});
			}

			const [updatedGroup] = await ctx.drizzleClient
				.update(volunteerGroupsTable)
				.set({
					name: parsedArgs.input.name,
					leaderId: parsedArgs.input.leaderId,
					maxVolunteerCount: parsedArgs.input.maxVolunteerCount,
					updaterId: currentUserId,
				})
				.where(eq(volunteerGroupsTable.id, parsedArgs.input.id))
				.returning();

			// Updated group not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
			if (updatedGroup === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return updatedGroup;
		},
		type: VolunteerGroups,
	}),
);
