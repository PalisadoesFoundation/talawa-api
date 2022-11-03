const User = require('../../models/User');
const { tenantCtx } = require('../../helper_functions');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_MESSAGE,
  USER_ALREADY_UNREGISTERED,
  USER_ALREADY_UNREGISTERED_MESSAGE,
  USER_ALREADY_UNREGISTERED_CODE,
  USER_ALREADY_UNREGISTERED_PARAM,
} = require('../../../constants');

const unregisterForEventByUser = async (parent, args, context) => {
  const { id, db } = await tenantCtx(args.id);
  const { Event } = db;
  const userFound = await User.findOne({
    _id: context.userId,
  });

  if (!userFound) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }
  const eventFound = await Event.findOne({
    _id: id,
  });

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

  if (index === -1) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
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
        _id: id,
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

    newEvent._doc._id = args.id;
    return newEvent;
  } else {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_ALREADY_UNREGISTERED
        : requestContext.translate(USER_ALREADY_UNREGISTERED_MESSAGE),
      USER_ALREADY_UNREGISTERED_CODE,
      USER_ALREADY_UNREGISTERED_PARAM
    );
  }
};

module.exports = unregisterForEventByUser;
