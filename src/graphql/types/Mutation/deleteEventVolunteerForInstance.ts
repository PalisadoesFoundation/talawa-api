import { z } from "zod";
import { eventVolunteerExceptionsTable } from "~/src/drizzle/tables/eventVolunteerExceptions";
import { builder } from "~/src/graphql/builder";
import {
	DeleteEventVolunteerForInstanceInput,
	deleteEventVolunteerForInstanceInputSchema,
} from "~/src/graphql/inputs/DeleteEventVolunteerForInstanceInput";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeleteEventVolunteerForInstanceArgumentsSchema = z.object({
	input: deleteEventVolunteerForInstanceInputSchema,
});

builder.mutationField("deleteEventVolunteerForInstance", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Delete a volunteer for a single recurring event instance",
				required: true,
				type: DeleteEventVolunteerForInstanceInput,
			}),
		},
		description:
			"Mutation to delete a volunteer for a single recurring event instance",
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
			} = mutationDeleteEventVolunteerForInstanceArgumentsSchema.safeParse(
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

			const { volunteerId, recurringEventInstanceId } = parsedArgs.input;

			ctx.log.info(
				`Attempting to delete volunteer for instance. volunteerId: ${volunteerId}, recurringEventInstanceId: ${recurringEventInstanceId}`,
			);

			const [existingVolunteer, existingEventInstance] = await Promise.all([
				ctx.drizzleClient.query.eventVolunteersTable.findFirst({
					where: (fields, { eq }) => eq(fields.id, volunteerId),
				}),
				ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
					where: (fields, { eq }) => eq(fields.id, recurringEventInstanceId),
				}),
			]);

			if (!existingVolunteer) {
				throw new TalawaGraphQLError({
					message: "The specified volunteer does not exist.",
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "volunteerId"],
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

			// Create an exception to mark this volunteer as excluded for this specific instance
			const [createdVolunteerException] = await ctx.drizzleClient
				.insert(eventVolunteerExceptionsTable)
				.values({
					volunteerId,
					recurringEventInstanceId,
					createdBy: ctx.currentClient.user.id,
					updatedBy: ctx.currentClient.user.id,
				})
				.onConflictDoUpdate({
					target: [
						eventVolunteerExceptionsTable.volunteerId,
						eventVolunteerExceptionsTable.recurringEventInstanceId,
					],
					set: {
						updatedBy: ctx.currentClient.user.id,
						updatedAt: new Date(),
					},
				})
				.returning();

			if (!createdVolunteerException) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}
			return existingVolunteer;
		},
		type: EventVolunteer,
	}),
);
