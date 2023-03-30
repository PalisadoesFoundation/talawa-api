import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import {
  adminCheck,
  getValidOrganizationById,
  getValidUserById,
} from "../../utilities";
import { User, Event } from "../../models";
import { EVENT_NOT_FOUND_ERROR } from "../../constants";
/**
 * This function enables an admin to remove a event
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the event exists
 * 2. If the organization exists
 * 3. If the user exists
 * 4. If the user is an admin of organization
 * @returns Deleted event
 */
export const adminRemoveEvent: MutationResolvers["adminRemoveEvent"] = async (
  _parent,
  args,
  context
) => {
  const event = await Event.findOne({
    _id: args.eventId,
  }).lean();

  // Checks whether event exists.
  if (!event) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM
    );
  }

  const organization = await getValidOrganizationById(event.organization);

  const currentUser = await getValidUserById(context.userId);

  // Checks whether currentUser is an admin of organization.
  await adminCheck(currentUser._id, organization);

  /*
  Removes event._id from eventAdmin, createdEvents and registeredEvents lists on
  currentUser document.
  */
  await User.updateOne(
    {
      _id: currentUser._id,
    },
    {
      $set: {
        eventAdmin: currentUser.eventAdmin.filter(
          (adminForEvent) => adminForEvent.toString() !== event?._id.toString()
        ),
        createdEvents: currentUser.createdEvents.filter(
          (createdEvent) => createdEvent.toString() !== event?._id.toString()
        ),
        registeredEvents: currentUser.registeredEvents.filter(
          (registeredEvent) =>
            registeredEvent.toString() !== event?._id.toString()
        ),
      },
    }
  );

  // Deletes the event.
  await Event.deleteOne({
    _id: event._id,
  });

  // Returns the deleted event.
  return event;
};
