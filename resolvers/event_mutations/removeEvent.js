const User = require('../../models/User');
const Event = require('../../models/Event');

const authCheck = require('../functions/authCheck');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const removeEvent = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const event = await Event.findOne({ _id: args.id });
  if (!event) {
    throw new NotFoundError(
      requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }

  const isUserOrganisationAdmin =
    user.adminFor.filter(
      (organisationId) =>
        organisationId.toString() === event.organization.toString()
    ).length > 0;

  const isUserEventAdmin =
    event.admins.filter(
      (userId) => userId.toString() === context.userId.toString()
    ).length > 0;

  const userCanDeleteThisEvent = isUserOrganisationAdmin || isUserEventAdmin;

  if (!userCanDeleteThisEvent) {
    throw new Error("Non-Admin User cannot delete event they didn't create");
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

  await Event.deleteOne({ _id: args.id });
  return event;
};

module.exports = removeEvent;
