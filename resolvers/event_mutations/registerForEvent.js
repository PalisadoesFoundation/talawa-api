const User = require('../../models/User');
const Event = require('../../models/Event');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const registerForEvent = async (parent, args, context) => {
  const userFound = await User.findOne({ _id: context.userId });
  if (!userFound) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const eventFound = await Event.findOne({ _id: args.id });
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

  let isAlreadyExists = false;
  if (index !== -1) {
    const isActive = eventFound.registrants[index].status === 'ACTIVE';
    if (isActive) {
      throw new NotFoundError(
        requestContext.translate('registrant.alreadyExist'),
        'registrant.alreadyExist',
        'registrant'
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
