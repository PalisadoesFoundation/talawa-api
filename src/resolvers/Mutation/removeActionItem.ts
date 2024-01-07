import {
  ACTION_ITEM_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, ActionItem, Event } from "../../models";
import { Types } from "mongoose";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
/**
 * This function enables to remove an action item.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the action item exists.
 * 3. If the user is authorized.
 * @returns deleted action item.
 */

export const removeActionItem: MutationResolvers["removeActionItem"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks if the user exists
  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const actionItem = await ActionItem.findOne({
    _id: args.id,
  })
    .populate("category")
    .lean();

  // Checks if the actionItem exists
  if (!actionItem) {
    throw new errors.NotFoundError(
      requestContext.translate(ACTION_ITEM_NOT_FOUND_ERROR.MESSAGE),
      ACTION_ITEM_NOT_FOUND_ERROR.CODE,
      ACTION_ITEM_NOT_FOUND_ERROR.PARAM
    );
  }

  const currentUserIsOrgAdmin = currentUser.adminFor.some(
    (ogranizationId) =>
      ogranizationId === actionItem.category.org ||
      Types.ObjectId(ogranizationId).equals(actionItem.category.org)
  );

  let currentUserIsEventAdmin = false;

  if (actionItem.event) {
    let currEvent: InterfaceEvent | null;

    const eventFoundInCache = await findEventsInCache([actionItem.event]);

    currEvent = eventFoundInCache[0];

    if (eventFoundInCache[0] === null) {
      currEvent = await Event.findOne({
        _id: actionItem.event,
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
        EVENT_NOT_FOUND_ERROR.PARAM
      );
    }

    // Checks if the currUser is an admin of the event
    currentUserIsEventAdmin = currEvent.admins.some(
      (admin) =>
        admin === context.userID || Types.ObjectId(admin).equals(context.userId)
    );
  }

  // Checks if the user is authorized for the operation.
  if (
    currentUserIsEventAdmin === false &&
    currentUserIsOrgAdmin === false &&
    currentUser.userType !== "SUPERADMIN"
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  if (actionItem.event) {
    await Event.updateOne(
      {
        _id: actionItem.event,
      },
      {
        $pull: { actionItems: actionItem._id },
      }
    );
  }

  await ActionItem.deleteOne({
    _id: args.id,
  });

  return actionItem;
};
