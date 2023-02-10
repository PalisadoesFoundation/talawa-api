import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Task, Event } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,
} from "../../constants";

export const createTask: MutationResolvers["createTask"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id == context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const eventExists = await Event.exists({
    _id: args.eventId,
  });

  // Checks whether event with _id == args.eventId exists.
  if (eventExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }

  // Creates new task.
  const createdTask = await Task.create({
    ...args.data,
    event: args.eventId,
    creator: context.userId,
  });

  // Adds createdTask._id to tasks list on event's document with _id === args.eventId.
  await Event.updateOne(
    {
      _id: args.eventId,
    },
    {
      $push: {
        tasks: createdTask._id,
      },
    }
  );

  // Returns createdTask.
  return createdTask.toObject();
};
