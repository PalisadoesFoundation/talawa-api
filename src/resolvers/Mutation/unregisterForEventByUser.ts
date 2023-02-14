import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Event } from "../../models";
import {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_MESSAGE,
  USER_ALREADY_UNREGISTERED_MESSAGE,
  USER_ALREADY_UNREGISTERED_CODE,
  USER_ALREADY_UNREGISTERED_PARAM,
} from "../../constants";

export const unregisterForEventByUser: MutationResolvers["unregisterForEventByUser"] =
  async (_parent, args, context) => {
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

    // gets position(index) of current user's _id in the registrants list of event
    const index = event.registrants.findIndex((element) => {
      return String(element.userId) === String(context.userId);
    });

    // checks if current user is a registrant of event
    if (index === -1) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    if (event.registrants[index].status === "ACTIVE") {
      const updatedRegistrants = event.registrants;
      updatedRegistrants[index] = {
        id: updatedRegistrants[index].id,
        userId: updatedRegistrants[index].userId,
        user: updatedRegistrants[index].user,
        status: "DELETED",
        createdAt: updatedRegistrants[index].createdAt,
      };

      return await Event.findOneAndUpdate(
        {
          _id: args.id,
          status: "ACTIVE",
        },
        {
          $set: {
            registrants: updatedRegistrants,
          },
        },
        {
          new: true,
        }
      ).lean();
    } else {
      throw new errors.NotFoundError(
        requestContext.translate(USER_ALREADY_UNREGISTERED_MESSAGE),
        USER_ALREADY_UNREGISTERED_CODE,
        USER_ALREADY_UNREGISTERED_PARAM
      );
    }
  };
