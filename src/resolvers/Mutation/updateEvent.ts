import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Event } from "../../models";
import {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
  LENGTH_VALIDATION_ERROR,
} from "../../constants";
import { isValidString } from "../../libraries/validators/validateString";

export const updateEvent: MutationResolvers["updateEvent"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // checks if current user exists
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const event = await Event.findOne({
    _id: args.id,
  }).lean();

  // checks if there exists an event with _id === args.id
  if (!event) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }

  const currentUserIsEventAdmin = event.admins.some(
    (admin) => admin.toString() === context.userId.toString()
  );

  // checks if current user is an admin of the event with _id === args.id
  if (currentUserIsEventAdmin === false) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  // Checks if the recieved arguments are valid according to standard input norms
  const validationResult_Title = isValidString(args.data!.title!, 256);
  const validationResult_Description = isValidString(
    args.data!.description!,
    500
  );
  const validationResult_Location = isValidString(args.data!.location!, 50);
  if (!validationResult_Title.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.message} 256 characters in title`
      ),
      LENGTH_VALIDATION_ERROR.code
    );
  }
  if (!validationResult_Description.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.message} 500 characters in description`
      ),
      LENGTH_VALIDATION_ERROR.code
    );
  }
  if (!validationResult_Location.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.message} 50 characters in location`
      ),
      LENGTH_VALIDATION_ERROR.code
    );
  }

  return await Event.findOneAndUpdate(
    {
      _id: args.id,
    },
    // @ts-ignore
    {
      ...args.data,
    },
    {
      new: true,
    }
  ).lean();
};
