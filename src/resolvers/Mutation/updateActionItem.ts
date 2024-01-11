import {
  ACTION_ITEM_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, ActionItem, Event } from "../../models";
import { Types } from "mongoose";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
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
 * @returns Updated action item.
 */

type UpdateActionItemInputType = {
  assignedTo: string;
  preCompletionNotes: string;
  postCompletionNotes: string;
  dueDate: Date;
  completed: boolean;
};

export const updateActionItem: MutationResolvers["updateActionItem"] = async (
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
    .populate("categoryId")
    .lean();

  // Checks if the actionItem exists
  if (!actionItem) {
    throw new errors.NotFoundError(
      requestContext.translate(ACTION_ITEM_NOT_FOUND_ERROR.MESSAGE),
      ACTION_ITEM_NOT_FOUND_ERROR.CODE,
      ACTION_ITEM_NOT_FOUND_ERROR.PARAM
    );
  }

  let sameAssignedUser = false;

  if (args.data.assignedTo) {
    sameAssignedUser = Types.ObjectId(actionItem.assignedTo).equals(
      args.data.assignedTo
    );

    if (!sameAssignedUser) {
      const newAssignedUser = await User.findOne({
        _id: args.data.assignedTo,
      });

      // Checks if the new asignee exists
      if (newAssignedUser === null) {
        throw new errors.NotFoundError(
          requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
          USER_NOT_FOUND_ERROR.CODE,
          USER_NOT_FOUND_ERROR.PARAM
        );
      }

      let userIsOrganizationMember = false;
      const currOrgId = actionItem.categoryId.orgId;
      userIsOrganizationMember = newAssignedUser.joinedOrganizations.some(
        (organizationId) =>
          organizationId === currOrgId ||
          Types.ObjectId(organizationId).equals(currOrgId)
      );

      // Checks if the new asignee is a member of the organization
      if (!userIsOrganizationMember) {
        throw new errors.NotFoundError(
          requestContext.translate(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE),
          USER_NOT_MEMBER_FOR_ORGANIZATION.CODE,
          USER_NOT_MEMBER_FOR_ORGANIZATION.PARAM
        );
      }
    }
  }

  const currentUserIsOrgAdmin = currentUser.adminFor.some(
    (ogranizationId) =>
      ogranizationId === actionItem.categoryId.orgId ||
      Types.ObjectId(ogranizationId).equals(actionItem.categoryId.orgId)
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

  const updatedAssignmentDate = sameAssignedUser
    ? actionItem.assignmentDate
    : new Date();

  const updatedAssignedBy = sameAssignedUser
    ? actionItem.assignedBy
    : context.userId;

  const updatedActionItem = await ActionItem.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      ...(args.data as UpdateActionItemInputType),
      assignmentDate: updatedAssignmentDate,
      assignedBy: updatedAssignedBy,
    },
    {
      new: true,
    }
  ).lean();

  return updatedActionItem;
};
