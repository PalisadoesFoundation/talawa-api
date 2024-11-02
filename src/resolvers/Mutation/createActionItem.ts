import mongoose from "mongoose";
import {
  ACTION_ITEM_CATEGORY_IS_DISABLED,
  ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceActionItem,
  InterfaceEvent,
  InterfaceEventVolunteer,
  InterfaceEventVolunteerGroup,
} from "../../models";
import {
  ActionItem,
  ActionItemCategory,
  Event,
  EventVolunteer,
  EventVolunteerGroup,
} from "../../models";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import {
  checkAppUserProfileExists,
  checkUserExists,
} from "../../utilities/checks";

/**
 * Creates a new action item and assigns it to a user.
 *
 * This function performs several checks:
 *
 * 1. Verifies if the current user exists.
 * 2. Ensures that the current user has an associated app user profile.
 * 3. Checks if the assignee exists.
 * 4. Validates if the action item category exists and is not disabled.
 * 5. If the action item is related to an event, checks if the event exists and whether the current user is an admin of that event.
 * 6. Verifies if the current user is an admin of the organization or a superadmin.
 *
 * @param _parent - The parent object for the mutation (not used in this function).
 * @param args - The arguments provided with the request, including:
 *   - `data`: An object containing:
 *     - `assigneeId`: The ID of the user to whom the action item is assigned.
 *     - `assigneeType`: The type of the assignee (EventVolunteer or EventVolunteerGroup).
 *     - `preCompletionNotes`: Notes to be added before the action item is completed.
 *     - `dueDate`: The due date for the action item.
 *     - `eventId` (optional): The ID of the event associated with the action item.
 *     - `actionItemCategoryId`: The ID of the action item category.
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
  const currentUser = await checkUserExists(context.userId);
  const currentUserAppProfile = await checkAppUserProfileExists(currentUser);

  const {
    assigneeId,
    assigneeType,
    preCompletionNotes,
    allottedHours,
    dueDate,
    eventId,
  } = args.data;

  let assignee: InterfaceEventVolunteer | InterfaceEventVolunteerGroup | null;
  if (assigneeType === "EventVolunteer") {
    assignee = await EventVolunteer.findById(assigneeId)
      .populate("user")
      .lean();
    if (!assignee) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE),
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.CODE,
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.PARAM,
      );
    }
  } else if (assigneeType === "EventVolunteerGroup") {
    assignee = await EventVolunteerGroup.findById(assigneeId).lean();
    if (!assignee) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE),
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.CODE,
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.PARAM,
      );
    }
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

  let currentUserIsEventAdmin = false;
  if (eventId) {
    let currEvent: InterfaceEvent | null;

    const eventFoundInCache = await findEventsInCache([eventId]);

    currEvent = eventFoundInCache[0];

    if (eventFoundInCache[0] === null) {
      currEvent = await Event.findOne({
        _id: eventId,
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
  /* c8 ignore start */
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
  /* c8 ignore stop */

  // Creates and returns the new action item.
  const createActionItem = await ActionItem.create({
    assignee: assigneeType === "EventVolunteer" ? assigneeId : undefined,
    assigneeGroup:
      assigneeType === "EventVolunteerGroup" ? assigneeId : undefined,
    assigneeUser: assigneeType === "User" ? assigneeId : undefined,
    assigneeType,
    assigner: context.userId,
    actionItemCategory: args.actionItemCategoryId,
    preCompletionNotes,
    allottedHours,
    dueDate,
    event: eventId,
    organization: actionItemCategory.organizationId,
    creator: context.userId,
  });

  if (assigneeType === "EventVolunteer") {
    await EventVolunteer.findByIdAndUpdate(assigneeId, {
      $addToSet: { assignments: createActionItem._id },
    });
  } else if (assigneeType === "EventVolunteerGroup") {
    const newGrp = (await EventVolunteerGroup.findByIdAndUpdate(
      assigneeId,
      { $addToSet: { assignments: createActionItem._id } },
      { new: true },
    ).lean()) as InterfaceEventVolunteerGroup;

    await EventVolunteer.updateMany(
      { _id: { $in: newGrp.volunteers } },
      { $addToSet: { assignments: createActionItem._id } },
    );
  }

  return createActionItem.toObject();
};
