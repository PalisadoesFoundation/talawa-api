import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event, InterfaceUser, InterfaceUserAttende } from "../../models";
import { errors } from "../../libraries";
import { EVENT_NOT_FOUND_ERROR } from "../../constants";
/**
 * This query will fetch all the registrants of the Event from the database.
 * @param _parent-
 * @param args - An object that contains `id` of the event.
 * @returns An object that contains list of all the Registrants.
 * If the event is not found then it throws an `NotFoundError` error.
 */
export const registrantsByEvent: QueryResolvers["registrantsByEvent"] = async (
  _parent,
  args
) => {
  const event = await Event.findOne({
    _id: args.id,
    status: "ACTIVE",
  })
    .populate("registrants.user", "-password")
    .lean();

  if (!event) {
    throw new errors.NotFoundError(
      EVENT_NOT_FOUND_ERROR.DESC,
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM
    );
  }

  const registrants: InterfaceUser[] = [];

  if (event.registrants.length > 0) {
    event.registrants.map((registrant: InterfaceUserAttende) => {
      if (registrant.status === "ACTIVE") {
        registrants.push(registrant.user);
      }
    });
  }

  return registrants;
};
