import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { Event, Interface_User, Interface_UserAttende } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  IN_PRODUCTION,
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_PARAM,
} from "../../../constants";

/**
 * This query will fetch all the registrants of the Event from the database.
 * @param _parent 
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
      IN_PRODUCTION !== true
        ? EVENT_NOT_FOUND
        : requestContext.translate(EVENT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }

  const registrants: Array<Interface_User> = [];

  if (event.registrants.length > 0) {
    event.registrants.map((registrant: Interface_UserAttende) => {
      if (registrant.status === "ACTIVE") {
        registrants.push(registrant.user);
      }
    });
  }

  return registrants;
};
