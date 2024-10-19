import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { EventVolunteer, InterfaceEventVolunteer } from "../../models";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";

/**
 * This query will fetch all events volunteers for the given eventId from database.
 * @param _parent-
 * @param args - An object that contains `id` of the Event.
 * @returns An object that holds all Event Volunteers for the given Event
 */
export const getEventVolunteers: QueryResolvers["getEventVolunteers"] = async (
  _parent,
  args,
) => {
  const sort = getSort(args.orderBy);
  const {
    id,
    name_contains: nameContains,
    hasAccepted,
    eventId,
    groupId,
  } = args.where;
  const where = getWhere({ id, hasAccepted });

  const volunteers = await EventVolunteer.find({
    event: eventId,
    ...(groupId && {
      groups: {
        $in: groupId,
      },
    }),
    ...where,
  })
    .populate("user", "-password")
    .populate("event")
    .populate("groups")
    .populate({
      path: "assignments",
      populate: {
        path: "actionItemCategory",
      },
    })
    .sort(sort)
    .lean();

  let filteredVolunteers: InterfaceEventVolunteer[] = volunteers;

  if (nameContains) {
    filteredVolunteers = filteredVolunteers.filter((volunteer) => {
      const tempVolunteer = volunteer as InterfaceEventVolunteer;
      let name =
        tempVolunteer.user.firstName + " " + tempVolunteer.user.lastName;
      return name.includes(nameContains);
    });
  }

  return filteredVolunteers;
};
