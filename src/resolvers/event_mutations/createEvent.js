const { NotFoundError } = require('errors');
const User = require('../../models/User');
const Event = require('../../models/Event');
const Organization = require('../../models/Organization');
const requestContext = require('talawa-request-context');

const createEvent = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  // Ensure Organization Exists
  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }

  // Check if user created the Organization
  let userCreatedOrg = false;
  let createdOrganizations = user.createdOrganizations;

  for (let i = 0; i < createdOrganizations.length; i++) {
    if (createdOrganizations[i]._id.equals(args.data.organizationId)) {
      userCreatedOrg = true;
      break;
    }
  }

  // Check if user joined the Organization
  let userJoinedOrg = false;
  let joinedOrganizations = user.joinedOrganizations;

  for (let i = 0; i < joinedOrganizations.length; i++) {
    if (joinedOrganizations[i]._id.equals(args.data.organizationId)) {
      userJoinedOrg = true;
      break;
    }
  }

  // Create Event if User Joined or Created the Organization
  if (userCreatedOrg || userJoinedOrg) {
    const newEvent = new Event({
      ...args.data,
      creator: context.userId,
      registrants: [
        {
          userId: context.userId,
          user: context.userId,
        },
      ],
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
