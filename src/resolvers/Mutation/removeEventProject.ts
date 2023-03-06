import { User, EventProject } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  EVENT_PROJECT_NOT_FOUND_CODE,
  EVENT_PROJECT_NOT_FOUND_MESSAGE,
  EVENT_PROJECT_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_PARAM,
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
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const eventProject = await EventProject.findOne({
    _id: args.id,
  }).lean();

  // Checks whether eventProject exists.
  if (!eventProject) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_PROJECT_NOT_FOUND_MESSAGE),
      EVENT_PROJECT_NOT_FOUND_CODE,
      EVENT_PROJECT_NOT_FOUND_PARAM
    );
  }

  // Checks whether currentUser with _id === context.userId is not the creator of eventProject.
  if (eventProject.creator.toString() !== context.userId.toString()) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  await EventProject.deleteOne({
    _id: args.id,
  });

  return eventProject;
};
