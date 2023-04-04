import { Types } from "mongoose";
import { EVENT_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Event } from "../../models";

/**
 * Throws error if there exists no `Event` with the given `id` else returns matching `Event` document
 * @param eventId - `id` of the desried event
 */
export const getValidEventById = async (eventId: string | Types.ObjectId) => {
  const event = await Event.findOne({
    _id: eventId,
  }).lean();

  if (!event) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM
    );
  }

  return event;
};
