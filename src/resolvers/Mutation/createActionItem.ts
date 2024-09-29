import mongoose from "mongoose";
import {
  ACTION_ITEM_CATEGORY_IS_DISABLED,
  ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceActionItem,
  InterfaceAppUserProfile,
  InterfaceEvent,
  InterfaceUser,
} from "../../models";
import {
  ActionItem,
  ActionItemCategory,
  AppUserProfile,
  Event,
  User,
} from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Creates a new action item and assigns it to a user.
 *
 * This function performs several checks:
 *
 * 1. Verifies if the current user exists.
 * 2. Ensures that the current user has an associated app user profile.
 * 3. Checks if the assignee exists.
 * 4. Validates if the action item category exists and is not disabled.
 * 5. Confirms that the assignee is a member of the organization associated with the action item category.
 * 6. If the action item is related to an event, checks if the event exists and whether the current user is an admin of that event.
 * 7. Verifies if the current user is an admin of the organization or a superadmin.
 *
 * @param _parent - The parent object for the mutation (not used in this function).
 * @param args - The arguments provided with the request, including:
 *   - `data`: An object containing:
 *     - `assigneeId`: The ID of the user to whom the action item is assigned.
 *     - `preCompletionNotes`: Notes to be added before the action item is completed.
 *     - `dueDate`: The due date for the action item.
 *     - `eventId` (optional): The ID of the event associated with the action item.
 *   - `actionItemCategoryId`: The ID of the action item category.
 * @param context - The context of the entire application, including user information and other context-specific data.
 *
 * @returns A promise that resolves to the created action item object.
 *
 */
export const createActionItem: MutationResolvers["createActionItem"] = async (
  _parent,
  args,
  context,
): Promise<InterfaceActionItem> => {
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

  // Checks whether currentUser with _id === context.userId exists.
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

  const assignee = await User.findOne({
    _id: args.data.assigneeId,
  });

  // Checks whether the assignee exists.
  if (assignee === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  const actionItemCategory = await ActionItemCategory.findOne({
    _id: args.actionItemCategoryId,
  }).lean();

  // Checks if the actionItemCategory exists.
  if (!actionItemCategory) {
    throw new errors.NotFoundError(
      requestContext.translate(ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.MESSAGE),
      ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.CODE,
      ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Checks if the actionItemCategory is disabled.
  if (actionItemCategory.isDisabled) {
    throw new errors.ConflictError(
      requestContext.translate(ACTION_ITEM_CATEGORY_IS_DISABLED.MESSAGE),
      ACTION_ITEM_CATEGORY_IS_DISABLED.CODE,
      ACTION_ITEM_CATEGORY_IS_DISABLED.PARAM,
    );
  }

  let asigneeIsOrganizationMember = false;
  asigneeIsOrganizationMember = assignee.joinedOrganizations.some(
    (organizationId) =>
      organizationId === actionItemCategory.organizationId ||
      new mongoose.Types.ObjectId(organizationId.toString()).equals(
        actionItemCategory.organizationId,
      ),
  );

  // Checks if the asignee is a member of the organization
  if (!asigneeIsOrganizationMember) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE),
      USER_NOT_MEMBER_FOR_ORGANIZATION.CODE,
      USER_NOT_MEMBER_FOR_ORGANIZATION.PARAM,
    );
  }

  let currentUserIsEventAdmin = false;

  if (args.data.eventId) {
    let currEvent: InterfaceEvent | null;

    const eventFoundInCache = await findEventsInCache([args.data.eventId]);

    currEvent = eventFoundInCache[0];

    if (eventFoundInCache[0] === null) {
      currEvent = await Event.findOne({
        _id: args.data.eventId,
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

    // Checks if the currUser is an admin of the event.
    currentUserIsEventAdmin = currEvent.admins.some(
      (admin) =>
        admin === context.userID ||
        new mongoose.Types.ObjectId(admin.toString()).equals(context.userId),
    );
  }

  // Checks if the currentUser is an admin of the organization.
  const currentUserIsOrgAdmin = currentUserAppProfile.adminFor.some(
    (organizationId) =>
      (organizationId &&
        organizationId === actionItemCategory.organizationId) ||
      new mongoose.Types.ObjectId(organizationId?.toString()).equals(
        actionItemCategory.organizationId,
      ),
  );

  // Checks whether the currentUser is authorized for the operation.
  if (
    currentUserIsEventAdmin === false &&
    currentUserIsOrgAdmin === false &&
    !currentUserAppProfile.isSuperAdmin
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Creates and returns the new action item.
  const createActionItem = await ActionItem.create({
    assignee: args.data.assigneeId,
    assigner: context.userId,
    actionItemCategory: args.actionItemCategoryId,
    preCompletionNotes: args.data.preCompletionNotes,
    allotedHours: args.data.allotedHours,
    dueDate: args.data.dueDate,
    event: args.data.eventId,
    organization: actionItemCategory.organizationId,
    creator: context.userId,
  });

  return createActionItem.toObject();
};
