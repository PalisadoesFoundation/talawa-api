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
  CONFLICT_UNREGISTER_CODE,
  CONFLICT_UNREGISTER_MESSAGE,
  CONFLICT_UNREGISTER_PARAM,
} = require('../../../constants');

const unregisterForEventByUser = async (parent, args, context) => {
  const userFound = await User.findOne({
    _id: context.userId,
  });

  if (!userFound) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const eventFound = await Event.findOne({
    _id: args.id,
  });

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

  if (index === -1) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  if (eventFound.registrants[index].status === 'ACTIVE') {
    let updatedRegistrants = eventFound.registrants;
    updatedRegistrants[index] = {
      id: updatedRegistrants[index].id,
      userId: updatedRegistrants[index].userId,
      user: updatedRegistrants[index].user,
      status: 'DELETED',
      createdAt: updatedRegistrants[index].createdAt,
    };

    const newEvent = await Event.findOneAndUpdate(
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

    return newEvent;
  } else {
    throw new ConflictError(
      requestContext.translate(CONFLICT_UNREGISTER_MESSAGE),
      CONFLICT_UNREGISTER_CODE,
      CONFLICT_UNREGISTER_PARAM
    );
  }
};

module.exports = unregisterForEventByUser;
