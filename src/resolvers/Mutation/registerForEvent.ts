import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Event } from "../../models";
import {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND_ERROR,
  REGISTRANT_ALREADY_EXIST_CODE,
  REGISTRANT_ALREADY_EXIST_MESSAGE,
  REGISTRANT_ALREADY_EXIST_PARAM,
} from "../../constants";

export const registerForEvent: MutationResolvers["registerForEvent"] = async (
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

  const event = await Event.findOne({
    _id: args.id,
  }).lean();

  // Checks whether event exists.
  if (!event) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM
    );
  }

  const index = event.registrants.findIndex((registrant) => {
    return registrant.userId.toString() === context.userId.toString();
  });

  let currentUserIsEventRegistrant = false;

  // Checks whether currentUser with _id === context.userId is already a registrant for event.
  if (index !== -1) {
    if (event.registrants[index].status === "ACTIVE") {
      throw new errors.NotFoundError(
        requestContext.translate(REGISTRANT_ALREADY_EXIST_MESSAGE),
        REGISTRANT_ALREADY_EXIST_CODE,
        REGISTRANT_ALREADY_EXIST_PARAM
      );
    } else {
      currentUserIsEventRegistrant = true;
    }
  }

  // Checks whether currentUser with _id === context.userId is not registrant of event.
  if (currentUserIsEventRegistrant === false) {
    // Adds event._id to registeredEvents list of currentUser with _id === context.userId.
    await User.updateOne(
      {
        _id: context.userId,
      },
      {
        $push: {
          registeredEvents: event._id,
        },
      }
    );

    /*
    Adds currentUser with _id === context.userId new registrant to registrants
    list of event and returns the updated event.
    */
    return await Event.findOneAndUpdate(
      {
        _id: event._id,
        status: "ACTIVE",
      },
      {
        $push: {
          registrants: {
            userId: context.userId,
            user: context.userId,
          },
        },
      },
      {
        new: true,
      }
    ).lean();
  } else {
    const updatedRegistrants = event.registrants;

    // Sets registrant.status for user with _id === context.userId of event to ACTIVE.
    updatedRegistrants[index] = {
      id: updatedRegistrants[index].id,
      userId: updatedRegistrants[index].userId,
      user: updatedRegistrants[index].user,
      status: "ACTIVE",
      createdAt: updatedRegistrants[index].createdAt,
    };

    // Sets updatedRegistrants as registrants list of event and returns the updated event.
    return await Event.findOneAndUpdate(
      {
        _id: event._id,
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
  }
};
