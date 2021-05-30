const User = require('../../models/User');
const Event = require('../../models/Event');

const authCheck = require('../functions/authCheck');

const removeEvent = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) throw new Error('User does not exist');

  const event = await Event.findOne({ _id: args.id });
  if (!event) throw new Error('Event not found');

  const isUserOrganisationAdmin =
    user.adminFor.includes(event.organization.toString());

  const isUserEventAdmin =
    event.admins.includes(context.userId.toString());
    
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
