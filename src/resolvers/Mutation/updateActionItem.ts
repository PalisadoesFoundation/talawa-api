import mongoose from "mongoose";
import {
  ACTION_ITEM_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceEvent,
  InterfaceEventVolunteer,
  InterfaceEventVolunteerGroup,
  InterfaceUser,
} from "../../models";
import {
  ActionItem,
  Event,
  EventVolunteer,
  EventVolunteerGroup,
  User,
} from "../../models";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import {
  checkAppUserProfileExists,
  checkUserExists,
} from "../../utilities/checks";
/**
 * This function enables to update an action item.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. Whether the user exists
 * 2. Whether the user has an associated app user profile
 * 3. Whether the action item exists
 * 4. Whether the user is authorized to update the action item
 * 5. Whether the user is an admin of the organization or a superadmin
 *
 * @returns Updated action item.
 */

type UpdateActionItemInputType = {
  assigneeId: string;
  assigneeType: string;
  preCompletionNotes: string;
  postCompletionNotes: string;
  dueDate: Date;
  allottedHours: number;
  completionDate: Date;
  isCompleted: boolean;
};

export const updateActionItem: MutationResolvers["updateActionItem"] = async (
  _parent,
  args,
  context,
) => {
  const currentUser = await checkUserExists(context.userId);
  const currentUserAppProfile = await checkAppUserProfileExists(currentUser);
  const { assigneeId, assigneeType, isCompleted } = args.data;

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

  let sameAssignee = false;

  if (assigneeId) {
    sameAssignee = new mongoose.Types.ObjectId(
      assigneeType === "EventVolunteer"
        ? actionItem.assignee.toString()
        : assigneeType === "EventVolunteerGroup"
          ? actionItem.assigneeGroup.toString()
          : actionItem.assigneeUser.toString(),
    ).equals(assigneeId);

    if (!sameAssignee) {
      let assignee:
        | InterfaceEventVolunteer
        | InterfaceEventVolunteerGroup
        | InterfaceUser
        | null;
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
            requestContext.translate(
              EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE,
            ),
            EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.CODE,
            EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.PARAM,
          );
        }
      } else if (assigneeType === "User") {
        assignee = await User.findById(assigneeId).lean();
        if (!assignee) {
          throw new errors.NotFoundError(
            requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
            USER_NOT_FOUND_ERROR.CODE,
            USER_NOT_FOUND_ERROR.PARAM,
          );
        }
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

  // Checks if the user is authorized for the operation. (Exception: when user updates the action item to complete or incomplete)
  if (
    isCompleted === undefined &&
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

  // checks if the assignee is an event volunteer then add allotted hours to the volunteer else if event volunteer group then add divided equal allotted hours to all volunteers in the group

  if (assigneeType === "EventVolunteer") {
    const assignee = await EventVolunteer.findById(assigneeId).lean();
    if (assignee) {
      if (isCompleted == true) {
        await EventVolunteer.findByIdAndUpdate(assigneeId, {
          $inc: {
            hoursVolunteered: actionItem.allottedHours
              ? actionItem.allottedHours
              : 0,
          },
          ...(actionItem.allottedHours
            ? {
                $push: {
                  hoursHistory: {
                    hours: actionItem.allottedHours,
                    date: new Date(),
                  },
                },
              }
            : {}),
        });
      } else if (isCompleted == false) {
        await EventVolunteer.findByIdAndUpdate(assigneeId, {
          $inc: {
            hoursVolunteered: actionItem.allottedHours
              ? -actionItem.allottedHours
              : -0,
          },
          ...(actionItem.allottedHours
            ? {
                $push: {
                  hoursHistory: {
                    hours: -actionItem.allottedHours,
                    date: new Date(),
                  },
                },
              }
            : {}),
        });
      }
    }
  } else if (assigneeType === "EventVolunteerGroup") {
    const volunteerGroup =
      await EventVolunteerGroup.findById(assigneeId).lean();
    if (volunteerGroup) {
      const dividedHours =
        (actionItem.allottedHours ?? 0) / volunteerGroup.volunteers.length;
      if (isCompleted == true) {
        await EventVolunteer.updateMany(
          { _id: { $in: volunteerGroup.volunteers } },
          {
            $inc: {
              hoursVolunteered: dividedHours,
            },
            ...(dividedHours
              ? {
                  $push: {
                    hoursHistory: {
                      hours: dividedHours,
                      date: new Date(),
                    },
                  },
                }
              : {}),
          },
        );
      } else if (isCompleted == false) {
        await EventVolunteer.updateMany(
          { _id: { $in: volunteerGroup.volunteers } },
          {
            $inc: {
              hoursVolunteered: -dividedHours,
            },
            ...(dividedHours
              ? {
                  $push: {
                    hoursHistory: {
                      hours: dividedHours,
                      date: new Date(),
                    },
                  },
                }
              : {}),
          },
        );
      }
    }
  }

  const updatedAssignmentDate = sameAssignee
    ? actionItem.assignmentDate
    : new Date();

  const updatedAssigner = sameAssignee ? actionItem.assigner : context.userId;

  const updatedActionItem = await ActionItem.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      ...(args.data as UpdateActionItemInputType),
      assigneeType: assigneeType || actionItem.assigneeType,
      assignee:
        !sameAssignee && assigneeType === "EventVolunteer"
          ? assigneeId || actionItem.assignee
          : isCompleted === undefined
            ? null
            : actionItem.assignee,
      assigneeGroup:
        !sameAssignee && assigneeType === "EventVolunteerGroup"
          ? assigneeId || actionItem.assigneeGroup
          : isCompleted === undefined
            ? null
            : actionItem.assigneeGroup,
      assigneeUser:
        !sameAssignee && assigneeType === "User"
          ? assigneeId || actionItem.assigneeUser
          : isCompleted === undefined
            ? null
            : actionItem.assigneeUser,
      assignmentDate: updatedAssignmentDate,
      assigner: updatedAssigner,
    },
    {
      new: true,
    },
  ).lean();

  return updatedActionItem;
};
