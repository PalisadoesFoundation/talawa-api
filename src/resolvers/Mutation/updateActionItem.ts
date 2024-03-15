import { Types } from "mongoose";
import {
  ACTION_ITEM_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { ActionItem, AppUserProfile, Event, User } from "../../models";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This function enables to update an action item.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the new asignee exists.
 * 2. If the action item exists.
 * 4. If the new asignee is a member of the organization.
 * 5. If the user is authorized.
 * 6. If the user has appUserProfile.
 * @returns Updated action item.
 */

type UpdateActionItemInputType = {
  assigneeId: string;
  preCompletionNotes: string;
  postCompletionNotes: string;
  dueDate: Date;
  completionDate: Date;
  isCompleted: boolean;
};

export const updateActionItem: MutationResolvers["updateActionItem"] = async (
  _parent,
  args,
  context,
) => {
  const currentUser = await User.findById({
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

  let sameAssignedUser = false;

  if (args.data.assigneeId) {
    sameAssignedUser = new Types.ObjectId(actionItem.assigneeId).equals(
      args.data.assigneeId,
    );

    if (!sameAssignedUser) {
      const newAssignedUser = await User.findOne({
        _id: args.data.assigneeId,
      });

      // Checks if the new asignee exists
      if (newAssignedUser === null) {
        throw new errors.NotFoundError(
          requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
          USER_NOT_FOUND_ERROR.CODE,
          USER_NOT_FOUND_ERROR.PARAM,
        );
      }

      let userIsOrganizationMember = false;
      const currorganizationId = actionItem.actionItemCategoryId.organizationId;
      userIsOrganizationMember = newAssignedUser.joinedOrganizations.some(
        (organizationId) =>
          organizationId === currorganizationId ||
          new Types.ObjectId(organizationId).equals(currorganizationId),
      );

      // Checks if the new asignee is a member of the organization
      if (!userIsOrganizationMember) {
        throw new errors.NotFoundError(
          requestContext.translate(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE),
          USER_NOT_MEMBER_FOR_ORGANIZATION.CODE,
          USER_NOT_MEMBER_FOR_ORGANIZATION.PARAM,
        );
      }
    }
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

  const updatedAssignmentDate = sameAssignedUser
    ? actionItem.assignmentDate
    : new Date();

  const updatedAssigner = sameAssignedUser
    ? actionItem.assignerId
    : context.userId;

  const updatedActionItem = await ActionItem.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      ...(args.data as UpdateActionItemInputType),
      assignmentDate: updatedAssignmentDate,
      assignerId: updatedAssigner,
    },
    {
      new: true,
    },
  ).lean();

  return updatedActionItem;
};
