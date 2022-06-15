const User = require('../../models/User');
const Event = require('../../models/Event');
const { NotFoundError } = require('../../helper_lib/errors');
const requestContext = require('../../helper_lib/request-context');
const {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,
  REGISTRANT_ALREADY_EXIST,
  REGISTRANT_ALREADY_EXIST_CODE,
  REGISTRANT_ALREADY_EXIST_MESSAGE,
  REGISTRANT_ALREADY_EXIST_PARAM,
} = require('../../../constants');
const registerForEvent = async (parent, args, context) => {
  const userFound = await User.findOne({ _id: context.userId });
  if (!userFound) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const eventFound = await Event.findOne({ _id: args.id });
  if (!eventFound) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? EVENT_NOT_FOUND
        : requestContext.translate(EVENT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }

  const index = eventFound.registrants.findIndex((element) => {
    return String(element.userId) === String(context.userId);
  });

  let isAlreadyExists = false;
  if (index !== -1) {
    const isActive = eventFound.registrants[index].status === 'ACTIVE';
    if (isActive) {
      throw new NotFoundError(
        !IN_PRODUCTION
          ? REGISTRANT_ALREADY_EXIST
          : requestContext.translate(REGISTRANT_ALREADY_EXIST_MESSAGE),
        REGISTRANT_ALREADY_EXIST_CODE,
        REGISTRANT_ALREADY_EXIST_PARAM
      );
    } else {
      isAlreadyExists = true;
    }
  }

  if (!isAlreadyExists) {
    await User.findOneAndUpdate(
      {
        _id: userFound.id,
      },
      {
        $push: {
          registeredEvents: eventFound,
        },
      }
    );
  }

  let newEvent;
  if (!isAlreadyExists) {
    newEvent = await Event.findOneAndUpdate(
      {
        _id: args.id,
        status: 'ACTIVE',
      },
      {
        $push: {
          registrants: {
            userId: userFound.id,
            user: userFound,
          },
        },
      },
      {
        new: true,
      }
    );
  } else {
    let updatedRegistrants = eventFound.registrants;
    updatedRegistrants[index] = {
      id: updatedRegistrants[index].id,
      userId: updatedRegistrants[index].userId,
      user: updatedRegistrants[index].user,
      status: 'ACTIVE',
      createdAt: updatedRegistrants[index].createdAt,
    };

    newEvent = await Event.findOneAndUpdate(
      {
        _id: args.id,
        status: 'ACTIVE',
      },
      {
        $set: {
          registrants: updatedRegistrants,
        },
      },
      {
        new: true,
      }
    );
  }

  return newEvent;
};

module.exports = registerForEvent;
