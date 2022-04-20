const User = require('../../models/User');
const Event = require('../../models/Event');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const unregisterForEventByUser = async (parent, args, context) => {
  const userFound = await User.findOne({
    _id: context.userId,
  });

  if (!userFound) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const eventFound = await Event.findOne({
    _id: args.id,
  });

  if (!eventFound) {
    throw new NotFoundError(
      requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }

  const index = eventFound.registrants.findIndex((element) => {
    return String(element.userId) === String(context.userId);
  });

  if (index === -1) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
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
    throw new NotFoundError(
      requestContext.translate('registrant.alreadyUnregistered'),
      'registrant.alreadyUnregistered',
      'registrant.alreadyUnregistered'
    );
  }
};

module.exports = unregisterForEventByUser;
