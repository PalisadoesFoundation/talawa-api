import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";
import { errors } from "../../libraries";
import { EVENT_NOT_FOUND_ERROR } from "../../constants";
/**
 * This query determines whether or not the user is registered for an event.
 * @param _parent -
 * @param args - An object that contains `eventId` of an event.
 * @param context - An object that contains `userId` of the User.
 * @returns An object that contains an `event` object and a boolean property `isRegistered`.
 * If the `event` is null or not found then throws `NotFoundError` error.
 */
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
      EVENT_NOT_FOUND_ERROR.DESC,
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM
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
