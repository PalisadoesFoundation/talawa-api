const { NotFoundError } = require('errors');
const User = require('../../models/User');
const Event = require('../../models/Event');
const Organization = require('../../models/Organization');
const requestContext = require('talawa-request-context');

const createEvent = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('event.notFound'),
      'user.notFound',
      'user'
    );
  }

  // Ensure Organization Exists
  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate('chat.notFound'),
      'chat.notFound',
      'chat'
    );
  }

  let flag = 0;
  let CreatedOrg = user.createdOrganizations;

  const newEvent = new Event({
    ...args.data,
    organization: args.data.organizationId,
    creator: context.userId,
    registrants: [],
    admins: [context.userId],
  });

  newEvent.registrants.push({
    userId: context.userId,
    user: context.userId,
  });

  await newEvent.save();

  // Add event to the user record
  await User.updateOne(
    { _id: user.id },
    {
      $push: {
        eventAdmin: newEvent,
        createdEvents: newEvent,
        registeredEvents: newEvent,
      },
    }
  );

  // If user hasn't joined the org then check if they have created the org
  if (!flag) {
    CreatedOrg.forEach((orgID) => {
      if (orgID.equals(args.data.organizationId)) {
        flag = 1;
      }
    });
  }

  // If user have joined or created the org then proceed with creating the event
  if (flag) {
    console.log('FLAG: ', flag);

    const newEvent = new Event({
      ...args.data,
      creator: context.userId,
      registrants: [context.userId],
      admins: [context.userId],
      organization: args.data.organizationId,
    });
    await newEvent.save();

    // add event to the user record
    await User.updateOne(
      { _id: user.id },
      {
        $push: {
          eventAdmin: newEvent,
          createdEvents: newEvent,
          registeredEvents: newEvent,
        },
      }
    );

    return {
      ...newEvent._doc,
    };
  }
  // If user hasen't joined or created the org then throw an error
  throw new NotFoundError(
    requestContext.translate('org.notAuthorized'),
    'org.notAuthorized',
    'org'
  );
};

module.exports = createEvent;
