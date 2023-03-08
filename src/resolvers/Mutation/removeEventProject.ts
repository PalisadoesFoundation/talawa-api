import { User, EventProject } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  IN_PRODUCTION,
  USER_NOT_FOUND_ERROR,
  EVENT_PROJECT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";

export const removeEventProject = async (
  _parent: any,
  args: any,
  context: any
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks if currentUser with _id === context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND_ERROR.DESC
        : requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const eventProject = await EventProject.findOne({
    _id: args.id,
  }).lean();

  // Checks whether eventProject exists.
  if (!eventProject) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? EVENT_PROJECT_NOT_FOUND_ERROR.DESC
        : requestContext.translate(EVENT_PROJECT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_PROJECT_NOT_FOUND_ERROR.CODE,
      EVENT_PROJECT_NOT_FOUND_ERROR.PARAM
    );
  }

  // Checks whether currentUser with _id === context.userId is not the creator of eventProject.
  if (eventProject.creator.toString() !== context.userId.toString()) {
    throw new errors.UnauthorizedError(
      IN_PRODUCTION !== true
        ? USER_NOT_AUTHORIZED_ERROR.DESC
        : requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  await EventProject.deleteOne({
    _id: args.id,
  });

  return eventProject;
};
