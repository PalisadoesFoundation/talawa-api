import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  IN_PRODUCTION,
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,
} from "../../constants";

export const event: QueryResolvers["event"] = async (_parent, args) => {
  const event = await Event.findOne({
    _id: args.id,
    status: "ACTIVE",
  })
    .populate("creator", "-password")
    .populate("tasks")
    .populate("admins", "-password")
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

  return event;
};
