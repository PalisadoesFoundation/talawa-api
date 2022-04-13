const User = require('../../models/User');
const Event = require('../../models/Event');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_EVENT_CODE,
  NOT_FOUND_EVENT_MESSAGE,
  NOT_FOUND_EVENT_PARAM,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_PARAM,
} = require('../../../constants');
const removeEvent = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const event = await Event.findOne({ _id: args.id });
  if (!event) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_EVENT_MESSAGE),
      NOT_FOUND_EVENT_CODE,
      NOT_FOUND_EVENT_PARAM
    );
  }
  const isUserOrganisationAdmin = user.adminFor.includes(
    event.organization.toString()
  );

  const isUserEventAdmin = event.admins.includes(context.userId.toString());
  const userCanDeleteThisEvent = isUserOrganisationAdmin || isUserEventAdmin;

  if (!userCanDeleteThisEvent) {
    throw new UnauthorizedError(
      requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
    );
  }

  await User.updateMany(
    { createdEvents: args.id },
    {
      $pull: {
        createdEvents: args.id,
      },
    }
  );

  await User.updateMany(
    { eventAdmin: args.id },
    {
      $pull: {
        eventAdmin: args.id,
      },
    }
  );

  await Event.findOneAndUpdate({ _id: args.id }, { status: 'DELETED' });
  return event;
};

module.exports = removeEvent;
