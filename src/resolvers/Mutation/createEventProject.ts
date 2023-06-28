import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceEventProject } from "../../models";
import { User, EventProject, Event } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  EVENT_NOT_FOUND_ERROR,
} from "../../constants";

/**
 * This function enables to create an event project.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the event exists
 * 3. If the user is an admin of the event.
 * @returns Created event project
 */

export const createEventProject: MutationResolvers["createEventProject"] =
  async (_parent, args, context): Promise<InterfaceEventProject> => {
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

    const event = await Event.findOne({
      _id: args.data.eventId,
    }).lean();

    // Checks whether event exists.
    if (!event) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM
      );
    }

    const currentUserIsEventAdmin = event.admins.some((admin) =>
      admin.equals(context.userId)
    );

    // Checks whether currentUser with _id === context.userId is an admin of event.
    if (
      currentUserIsEventAdmin === false &&
      currentUser.userType !== "SUPERADMIN"
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    // Creates new eventProject.
    const createdEventProject = await EventProject.create({
      title: args.data.title,
      description: args.data.description,
      event: args.data.eventId,
      creator: context.userId,
    });

    // Returns createdEventProject.
    return createdEventProject.toObject();
  };
