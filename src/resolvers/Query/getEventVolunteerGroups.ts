import { EventVolunteerGroup } from "../../models";
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
    const where = getWhere(args.where);
    const eventVolunteerGroups = await EventVolunteerGroup.find({
      ...where,
    })
      .populate("eventId")
      .populate("creatorId")
      .populate("leaderId")
      .populate("volunteers");

    return eventVolunteerGroups;
  };
