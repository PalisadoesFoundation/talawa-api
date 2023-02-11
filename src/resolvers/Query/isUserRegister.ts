import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";
import { errors } from "../../libraries";
import {
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,
} from "../../constants";

export const isUserRegister: QueryResolvers["isUserRegister"] = async (
  _parent,
  args,
  context
) => {
  const event = await Event.findOne({
    _id: args.eventId,
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

  let isCurrentUserRegistered = false;

  for (const registrant of event.registrants) {
    if (
      registrant.userId === context.userId &&
      registrant.status === "ACTIVE"
    ) {
      isCurrentUserRegistered = true;
      break;
    }
  }

  return {
    event,
    isRegistered: isCurrentUserRegistered,
  };
};
