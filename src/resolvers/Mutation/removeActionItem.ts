import { Types } from "mongoose";
import {
  ACTION_ITEM_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { ActionItem, AppUserProfile, Event, User } from "../../models";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This function enables to remove an action item.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the action item exists.
 * 3. If the user is authorized.
 * 4. If the user has appUserProfile.
 * @returns deleted action item.
 */

export const removeActionItem: MutationResolvers["removeActionItem"] = async (
  _parent,
  args,
  context,
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks if the user exists
  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const currentUserAppProfile = await AppUserProfile.findOne({
    userId: currentUser._id,
  }).lean();

  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  const actionItem = await ActionItem.findOne({
    _id: args.id,
  })
    .populate("actionItemCategoryId")
    .lean();

  // Checks if the actionItem exists
  if (!actionItem) {
    throw new errors.NotFoundError(
      requestContext.translate(ACTION_ITEM_NOT_FOUND_ERROR.MESSAGE),
      ACTION_ITEM_NOT_FOUND_ERROR.CODE,
      ACTION_ITEM_NOT_FOUND_ERROR.PARAM,
    );
  }

  const currentUserIsOrgAdmin = currentUserAppProfile.adminFor.some(
    (ogranizationId) =>
      ogranizationId === actionItem.actionItemCategoryId.organizationId ||
      new Types.ObjectId(ogranizationId?.toString()).equals(
        actionItem.actionItemCategoryId.organizationId,
      ),
  );

  let currentUserIsEventAdmin = false;

  if (actionItem.eventId) {
    let currEvent: InterfaceEvent | null;

    const eventFoundInCache = await findEventsInCache([actionItem.eventId]);

    currEvent = eventFoundInCache[0];

    if (eventFoundInCache[0] === null) {
      currEvent = await Event.findOne({
        _id: actionItem.eventId,
      }).lean();

      if (currEvent !== null) {
        await cacheEvents([currEvent]);
      }
    }

    // Checks whether currEvent exists.
    if (!currEvent) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks if the currUser is an admin of the event
    currentUserIsEventAdmin = currEvent.admins.some(
      (admin) =>
        admin === context.userID ||
        new Types.ObjectId(admin).equals(context.userId),
    );
  }

  // Checks if the user is authorized for the operation.
  if (
    currentUserIsEventAdmin === false &&
    currentUserIsOrgAdmin === false &&
    currentUserAppProfile.isSuperAdmin === false
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  await ActionItem.deleteOne({
    _id: args.id,
  });

  return actionItem;
};
