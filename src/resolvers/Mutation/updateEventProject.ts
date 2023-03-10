import { User, EventProject } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  EVENT_NOT_FOUND_ERROR,
  EVENT_PROJECT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";

export const updateEventProject = async (
  _parent: any,
  args: any,
  context: any
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  if (currentUserExists === false) {
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
  if (eventProject.creator.toString() !== context.userId.toString()) {
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
      ...args.data,
    },
    {
      new: true,
    }
  ).lean();
};
