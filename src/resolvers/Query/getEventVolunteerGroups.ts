import type {
  InterfaceEventVolunteer,
  InterfaceEventVolunteerGroup} from "../../models";
import {
  EventVolunteer,
  EventVolunteerGroup
} from "../../models";
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
    const { eventId, leaderName, userId } = args.where;
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
    } else if (userId) {
      const eventVolunteer = (await EventVolunteer.findOne({
        user: userId,
      })
        .populate({
          path: "groups",
          //  populate multiple fields with groups (event, creator, leader, volunteers (eithin it users), assigments (within it actionItemCategory)) all fields from above
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
        .lean()) as InterfaceEventVolunteer;

      eventVolunteerGroups = eventVolunteer.groups;
    }

    let filteredEventVolunteerGroups: InterfaceEventVolunteerGroup[] =
      eventVolunteerGroups;

    if (leaderName) {
      filteredEventVolunteerGroups = filteredEventVolunteerGroups.filter(
        (group) => {
          const tempGroup = group as InterfaceEventVolunteerGroup;
          const name =
            tempGroup.leader.firstName + " " + tempGroup.leader.lastName;
          return name.includes(leaderName);
        },
      );
    }

    switch (args.orderBy) {
      case "members_ASC":
        filteredEventVolunteerGroups = filteredEventVolunteerGroups.sort(
          (a, b) => a.volunteers.length - b.volunteers.length,
        );
        break;
      case "members_DESC":
        filteredEventVolunteerGroups = filteredEventVolunteerGroups.sort(
          (a, b) => b.volunteers.length - a.volunteers.length,
        );
        break;
      case "assignments_ASC":
        filteredEventVolunteerGroups = filteredEventVolunteerGroups.sort(
          (a, b) => a.assignments.length - b.assignments.length,
        );
        break;
      case "assignments_DESC":
        filteredEventVolunteerGroups = filteredEventVolunteerGroups.sort(
          (a, b) => b.assignments.length - a.assignments.length,
        );
        break;
      default:
        break;
    }

    return filteredEventVolunteerGroups;
  };
