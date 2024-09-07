import mongoose from "mongoose";
import {
  ACTION_ITEM_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceAppUserProfile,
  InterfaceEvent,
  InterfaceUser,
} from "../../models";
import { ActionItem, AppUserProfile, Event, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
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
  allotedHours: number;
  completionDate: Date;
  isCompleted: boolean;
};

export const updateActionItem: MutationResolvers["updateActionItem"] = async (
  _parent,
  args,
  context,
) => {
  let currentUser: InterfaceUser | null;
  const userFoundInCache = await findUserInCache([context.userId]);
  currentUser = userFoundInCache[0];
  if (currentUser === null) {
    currentUser = await User.findOne({
      _id: context.userId,
    }).lean();
    if (currentUser !== null) {
      await cacheUsers([currentUser]);
    }
  }

  // Checks if the user exists
  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  let currentUserAppProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    currentUser.appUserProfileId?.toString(),
  ]);
  currentUserAppProfile = appUserProfileFoundInCache[0];
  if (currentUserAppProfile === null) {
    currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (currentUserAppProfile !== null) {
      await cacheAppUserProfile([currentUserAppProfile]);
    }
  }
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
    .populate("actionItemCategory")
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
    sameAssignedUser = new mongoose.Types.ObjectId(
      actionItem.assignee.toString(),
    ).equals(args.data.assigneeId);

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
      const currorganizationId = actionItem.actionItemCategory.organizationId;
      userIsOrganizationMember = newAssignedUser.joinedOrganizations.some(
        (organizationId) =>
          organizationId === currorganizationId ||
          new mongoose.Types.ObjectId(organizationId.toString()).equals(
            currorganizationId,
          ),
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
      ogranizationId === actionItem.organization ||
      new mongoose.Types.ObjectId(ogranizationId?.toString()).equals(
        actionItem.organization,
      ),
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
        EVENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks if the currUser is an admin of the event
    currentUserIsEventAdmin = currEvent.admins.some(
      (admin) =>
        admin === context.userID ||
        new mongoose.Types.ObjectId(admin.toString()).equals(context.userId),
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
    ? actionItem.assigner
    : context.userId;

  const updatedActionItem = await ActionItem.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      ...(args.data as UpdateActionItemInputType),
      assignee: args.data.assigneeId || actionItem.assignee,
      assignmentDate: updatedAssignmentDate,
      assigner: updatedAssigner,
    },
    {
      new: true,
    },
  ).lean();

  return updatedActionItem;
};
