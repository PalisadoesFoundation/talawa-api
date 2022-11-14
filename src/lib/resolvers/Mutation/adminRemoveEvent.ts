import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";
import { User, Organization, Event } from "../../models";
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_MESSAGE,
} from "../../../constants";
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
      IN_PRODUCTION !== true
        ? EVENT_NOT_FOUND
        : requestContext.translate(EVENT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }

  const organization = await Organization.findOne({
    _id: event.organization,
  }).lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Checks whether currentUser is an admin of organization.
  adminCheck(currentUser._id, organization);

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
