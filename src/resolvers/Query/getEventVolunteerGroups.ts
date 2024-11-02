import type {
  InterfaceEvent,
  InterfaceEventVolunteer,
  InterfaceEventVolunteerGroup,
  InterfaceUser,
} from "../../models";
import { EventVolunteer, EventVolunteerGroup } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { getWhere } from "./helperFunctions/getWhere";
/**
 * This query will fetch eventVolunteerGroups as a transaction from database.
 * @param _parent-
 * @param args - An object that contains where object for eventVolunteerGroups.
 * @returns An array of `eventVolunteerGroup` object.
 */
export const getEventVolunteerGroups: QueryResolvers["getEventVolunteerGroups"] =
  async (_parent, args) => {
    const { eventId, leaderName, userId, orgId } = args.where;
    let eventVolunteerGroups: InterfaceEventVolunteerGroup[] = [];
    if (eventId) {
      const where = getWhere({ name_contains: args.where.name_contains });
      eventVolunteerGroups = await EventVolunteerGroup.find({
        event: eventId,
        ...where,
      })
        .populate("event")
        .populate("creator")
        .populate("leader")
        .populate({
          path: "volunteers",
          populate: {
            path: "user",
          },
        })
        .populate({
          path: "assignments",
          populate: {
            path: "actionItemCategory",
          },
        })
        .lean();
    } else if (userId && orgId) {
      const volunteerProfiles = (await EventVolunteer.find({
        user: userId,
      })
        .populate({
          path: "groups",
          populate: [
            {
              path: "event",
            },
            {
              path: "creator",
            },
            {
              path: "leader",
            },
            {
              path: "volunteers",
              populate: {
                path: "user",
              },
            },
            {
              path: "assignments",
              populate: {
                path: "actionItemCategory",
              },
            },
          ],
        })
        .populate("event")
        .lean()) as InterfaceEventVolunteer[];
      volunteerProfiles.forEach((volunteer) => {
        const tempEvent = volunteer.event as InterfaceEvent;
        if (tempEvent.organization.toString() == orgId)
          eventVolunteerGroups.push(...volunteer.groups);
      });
    }

    let filteredEventVolunteerGroups: InterfaceEventVolunteerGroup[] =
      eventVolunteerGroups;

    if (leaderName) {
      const tempName = leaderName.toLowerCase();
      filteredEventVolunteerGroups = filteredEventVolunteerGroups.filter(
        (group) => {
          const tempGroup = group as InterfaceEventVolunteerGroup;
          const tempLeader = tempGroup.leader as InterfaceUser;
          const { firstName, lastName } = tempLeader;
          const name = `${firstName} ${lastName}`.toLowerCase();
          return name.includes(tempName);
        },
      );
    }

    const sortConfigs = {
      /* c8 ignore start */
      volunteers_ASC: (
        a: InterfaceEventVolunteerGroup,
        b: InterfaceEventVolunteerGroup,
      ): number => a.volunteers.length - b.volunteers.length,
      /* c8 ignore stop */
      volunteers_DESC: (
        a: InterfaceEventVolunteerGroup,
        b: InterfaceEventVolunteerGroup,
      ): number => b.volunteers.length - a.volunteers.length,
      assignments_ASC: (
        a: InterfaceEventVolunteerGroup,
        b: InterfaceEventVolunteerGroup,
      ): number => a.assignments.length - b.assignments.length,
      assignments_DESC: (
        a: InterfaceEventVolunteerGroup,
        b: InterfaceEventVolunteerGroup,
      ): number => b.assignments.length - a.assignments.length,
    };

    if (args.orderBy && args.orderBy in sortConfigs) {
      filteredEventVolunteerGroups.sort(
        sortConfigs[args.orderBy as keyof typeof sortConfigs],
      );
    }

    return filteredEventVolunteerGroups;
  };
