import type { InterfaceEventProject } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, EventProject } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  EVENT_NOT_FOUND_ERROR,
  EVENT_PROJECT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";

/**
 * This function enables to update an event project.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the event project exists.
 * @returns Updated event project.
 */

export const updateEventProject: MutationResolvers["updateEventProject"] =
  async (_parent, args, context): Promise<InterfaceEventProject> => {
    const currentUser = await User.findOne({
      _id: context.userId,
    });

    if (currentUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    const eventProject = await EventProject.findOne({
      _id: args.id,
    }).lean();

    if (!eventProject) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_PROJECT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_PROJECT_NOT_FOUND_ERROR.PARAM
      );
    }

    // toString() method converts mongodb's objectId to a javascript string for comparision
    if (
      eventProject.createdBy.toString() !== context.userId.toString() &&
      currentUser.userType !== "SUPERADMIN"
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    return await EventProject.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        ...(args.data as any),
        updatedBy: context.userId,
      },
      {
        new: true,
      }
    ).lean();
  };
