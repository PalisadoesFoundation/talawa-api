import { z } from "zod";
import { eventVolunteerGroupExceptionsTable } from "~/src/drizzle/tables/eventVolunteerGroupExceptions";
import { builder } from "~/src/graphql/builder";
import {
	DeleteEventVolunteerGroupForInstanceInput,
	deleteEventVolunteerGroupForInstanceInputSchema,
} from "~/src/graphql/inputs/DeleteEventVolunteerGroupForInstanceInput";
import { EventVolunteerGroup } from "~/src/graphql/types/EventVolunteerGroup/EventVolunteerGroup";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeleteEventVolunteerGroupForInstanceArgumentsSchema = z.object({
	input: deleteEventVolunteerGroupForInstanceInputSchema,
});

builder.mutationField("deleteEventVolunteerGroupForInstance", (t) =>
	t.field({
		args: {
			input: t.arg({
				description:
					"Delete a volunteer group for a single recurring event instance",
				required: true,
				type: DeleteEventVolunteerGroupForInstanceInput,
			}),
		},
		description:
			"Mutation to delete a volunteer group for a single recurring event instance",
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
			} = mutationDeleteEventVolunteerGroupForInstanceArgumentsSchema.safeParse(
				args,
			);

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

			const { volunteerGroupId, recurringEventInstanceId } = parsedArgs.input;

			ctx.log.info(
				`Attempting to delete volunteer group for instance. volunteerGroupId: ${volunteerGroupId}, recurringEventInstanceId: ${recurringEventInstanceId}`,
			);

			const [existingVolunteerGroup, existingEventInstance] = await Promise.all(
				[
					ctx.drizzleClient.query.eventVolunteerGroupsTable.findFirst({
						where: (fields, { eq }) => eq(fields.id, volunteerGroupId),
					}),
					ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
						where: (fields, { eq }) => eq(fields.id, recurringEventInstanceId),
					}),
				],
			);

			if (!existingVolunteerGroup) {
				throw new TalawaGraphQLError({
					message: "The specified volunteer group does not exist.",
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "volunteerGroupId"],
							},
						],
					},
				});
			}

			if (!existingEventInstance) {
				throw new TalawaGraphQLError({
					message: "The specified event instance does not exist.",
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "recurringEventInstanceId"],
							},
						],
					},
				});
			}

			// Create an exception to mark this volunteer group as excluded for this specific instance
			const [createdVolunteerGroupException] = await ctx.drizzleClient
				.insert(eventVolunteerGroupExceptionsTable)
				.values({
					volunteerGroupId,
					recurringEventInstanceId,
					createdBy: ctx.currentClient.user.id,
					updatedBy: ctx.currentClient.user.id,
				})
				.onConflictDoUpdate({
					target: [
						eventVolunteerGroupExceptionsTable.volunteerGroupId,
						eventVolunteerGroupExceptionsTable.recurringEventInstanceId,
					],
					set: {
						updatedBy: ctx.currentClient.user.id,
						updatedAt: new Date(),
					},
				})
				.returning();

			if (!createdVolunteerGroupException) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return existingVolunteerGroup;
		},
		type: EventVolunteerGroup,
	}),
);
