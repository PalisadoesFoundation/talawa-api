import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event, Interface_User, Interface_UserAttende } from "../../models";
import { errors } from "../../libraries";
import {
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,
} from "../../constants";

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
      EVENT_NOT_FOUND,
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
