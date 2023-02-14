import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";
import { errors } from "../../libraries";
import {
  EVENT_NOT_FOUND,
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
      EVENT_NOT_FOUND,
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }

  return event;
};
