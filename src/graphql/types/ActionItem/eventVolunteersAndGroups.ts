import type { GraphQLContext } from "~/src/graphql/context";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import { EventVolunteerGroup } from "~/src/graphql/types/EventVolunteerGroup/EventVolunteerGroup";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItem } from "./ActionItem";

export const resolveVolunteer = async (
	parent: { volunteerId: string | null },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<EventVolunteer | null> => {
	// Null guard
	if (!parent.volunteerId) {
		return null;
	}

	// Query the volunteer by volunteerId using the imported eventVolunteersTable type.
	const volunteer =
		await ctx.drizzleClient.query.eventVolunteersTable.findFirst({
			where: (fields, operators) =>
				operators.eq(fields.id, parent.volunteerId as string),
		});

	// If not found, log error & throw an appropriate error code from the recognized union
	if (!volunteer) {
		ctx.log.error(
			`Volunteer with ID ${parent.volunteerId} not found for ActionItem.`,
		);

		throw new TalawaGraphQLError({
			message: "Volunteer not found",
			extensions: {
				code: "arguments_associated_resources_not_found",
				issues: [
					{
						argumentPath: ["volunteerId"],
					},
				],
			},
		});
	}

	return volunteer;
};

export const resolveVolunteerGroup = async (
	parent: { volunteerGroupId: string | null },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<EventVolunteerGroup | null> => {
	// Null guard
	if (!parent.volunteerGroupId) {
		return null;
	}

	// Query the volunteer group by volunteerGroupId using the imported eventVolunteerGroupsTable type.
	const volunteerGroup =
		await ctx.drizzleClient.query.eventVolunteerGroupsTable.findFirst({
			where: (fields, operators) =>
				operators.eq(fields.id, parent.volunteerGroupId as string),
		});

	// If not found, log error & throw an appropriate error code from the recognized union
	if (!volunteerGroup) {
		ctx.log.error(
			`Volunteer Group with ID ${parent.volunteerGroupId} not found for ActionItem.`,
		);

		throw new TalawaGraphQLError({
			message: "Volunteer Group not found",
			extensions: {
				code: "arguments_associated_resources_not_found",
				issues: [
					{
						argumentPath: ["volunteerGroupId"],
					},
				],
			},
		});
	}

	return volunteerGroup;
};

ActionItem.implement({
	fields: (t) => ({
		volunteer: t.field({
			type: EventVolunteer,
			nullable: true,
			description: "The volunteer assigned to this action item.",
			resolve: resolveVolunteer,
		}),
		volunteerGroup: t.field({
			type: EventVolunteerGroup,
			nullable: true,
			description: "The volunteer group assigned to this action item.",
			resolve: resolveVolunteerGroup,
		}),
	}),
});
