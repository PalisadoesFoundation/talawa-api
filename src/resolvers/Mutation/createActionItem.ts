import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceActionItem, InterfaceEvent } from "../../models";
import { User, Event, Category, ActionItem } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  EVENT_NOT_FOUND_ERROR,
  CATEGORY_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../constants";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { Types } from "mongoose";

/**
 * This function enables to create an action item.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 3. If the asignee exists
 * 4. If the category exists
 * 5. If the asignee is a member of the organization
 * 6. If the user is a member of the organization
 * 7. If the event exists (if action item related to an event)
 * 8. If the user is authorized.
 * @returns Created action item
 */

export const createActionItem: MutationResolvers["createActionItem"] = async (
  _parent,
  args,
  context
): Promise<InterfaceActionItem> => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks whether currentUser with _id === context.userId exists.
  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const assignee = await User.findOne({
    _id: args.data.assignedTo,
  });

  // Checks whether the asignee exists.
  if (assignee === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const category = await Category.findOne({
    _id: args.categoryId,
  }).lean();

  // Checks if the category exists
  if (!category) {
    throw new errors.NotFoundError(
      requestContext.translate(CATEGORY_NOT_FOUND_ERROR.MESSAGE),
      CATEGORY_NOT_FOUND_ERROR.CODE,
      CATEGORY_NOT_FOUND_ERROR.PARAM
    );
  }

  let asigneeIsOrganizationMember = false;
  asigneeIsOrganizationMember = assignee.joinedOrganizations.some(
    (organizationId) =>
      organizationId === category.orgId ||
      Types.ObjectId(organizationId).equals(category.orgId)
  );

  // Checks if the asignee is a member of the organization
  if (!asigneeIsOrganizationMember) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE),
      USER_NOT_MEMBER_FOR_ORGANIZATION.CODE,
      USER_NOT_MEMBER_FOR_ORGANIZATION.PARAM
    );
  }

  let currentUserIsEventAdmin = false;

  if (args.data.event) {
    let currEvent: InterfaceEvent | null;

    const eventFoundInCache = await findEventsInCache([args.data.event]);

    currEvent = eventFoundInCache[0];

    if (eventFoundInCache[0] === null) {
      currEvent = await Event.findOne({
        _id: args.data.event,
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

  // Checks if the currUser is an admin of the organization
  const currentUserIsOrgAdmin = currentUser.adminFor.some(
    (ogranizationId) =>
      ogranizationId === category.orgId ||
      Types.ObjectId(ogranizationId).equals(category.orgId)
  );

  // Checks whether currentUser with _id === context.userId is authorized for the operation.
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

  // Creates new action item.
  const createActionItem = await ActionItem.create({
    assignedTo: args.data.assignedTo,
    assignedBy: context.userId,
    categoryId: args.categoryId,
    preCompletionNotes: args.data.preCompletionNotes,
    postCompletionNotes: args.data.postCompletionNotes,
    dueDate: args.data.dueDate,
    completionDate: args.data.completionDate,
    event: args.data.event,
    createdBy: context.userId,
    updatedBy: context.userId,
  });

  if (args.data.event) {
    await Event.findOneAndUpdate(
      {
        _id: args.data.event,
      },
      {
        $push: { actionItems: createActionItem._id },
      }
    );
  }

  // Returns created action item.
  return createActionItem.toObject();
};
