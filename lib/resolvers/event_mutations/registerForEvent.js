const User = require('../../models/User');
const Event = require('../../models/Event');
const { NotFoundError, ConflictError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_EVENT_CODE,
  NOT_FOUND_EVENT_MESSAGE,
  NOT_FOUND_EVENT_PARAM,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  CONFLICT_REGISTER_CODE,
  CONFLICT_REGISTER_MESSAGE,
  CONFLICT_REGISTER_PARAM,
} = require('../../../constants');

const registerForEvent = async (parent, args, context) => {
  const userFound = await User.findOne({ _id: context.userId });
  if (!userFound) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const eventFound = await Event.findOne({ _id: args.id });
  if (!eventFound) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_EVENT_MESSAGE),
      NOT_FOUND_EVENT_CODE,
      NOT_FOUND_EVENT_PARAM
    );
  }

  const index = eventFound.registrants.findIndex((element) => {
    return String(element.userId) === String(context.userId);
  });

  let isAlreadyExists = false;
  if (index !== -1) {
    const isActive = eventFound.registrants[index].status === 'ACTIVE';
    if (isActive) {
      throw new ConflictError(
        requestContext.translate(CONFLICT_REGISTER_MESSAGE),
        CONFLICT_REGISTER_CODE,
        CONFLICT_REGISTER_PARAM
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
