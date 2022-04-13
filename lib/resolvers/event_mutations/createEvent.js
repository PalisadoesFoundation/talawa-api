const { NotFoundError, UnauthorizedError } = require('errors');
const User = require('../../models/User');
const Event = require('../../models/Event');
const Organization = require('../../models/Organization');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_AUTHORIZED_ORGANIZATION_CODE,
  NOT_AUTHORIZED_ORGANIZATION_MESSAGE,
  NOT_AUTHORIZED_ORGANIZATION_PARAM,
} = require('../../../constants');
const createEvent = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  // Ensure Organization Exists
  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_ORGANIZATION_MESSAGE),
      NOT_FOUND_ORGANIZATION_CODE,
      NOT_FOUND_ORGANIZATION_PARAM
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
  throw new UnauthorizedError(
    requestContext.translate(NOT_AUTHORIZED_ORGANIZATION_MESSAGE),
    NOT_AUTHORIZED_ORGANIZATION_CODE,
    NOT_AUTHORIZED_ORGANIZATION_PARAM
  );
};

module.exports = createEvent;
