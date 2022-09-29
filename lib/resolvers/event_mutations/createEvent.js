const { NotFoundError, UnauthorizedError } = require('errors');
const { addTenantId } = require('../../helper_functions/');
const { getTenantConnection } = require('../../../lib/ConnectionManager');
const User = require('../../models/User');
const Organization = require('../../models/Organization');
// const Event = require('../../models/Event');
const requestContext = require('talawa-request-context');
const {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_AUTHORIZED,
  ORGANIZATION_NOT_AUTHORIZED_MESSAGE,
  ORGANIZATION_NOT_AUTHORIZED_CODE,
  ORGANIZATION_NOT_AUTHORIZED_PARAM,
} = require('../../../constants');
var admin = require('firebase-admin');
var { applicationDefault } = require('firebase-admin').credential;

admin.initializeApp({ credential: applicationDefault() });

const createEvent = async (parent, args, context) => {
  const db = await getTenantConnection(args.data.organizationId);
  const { Event } = db;
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Ensure Organization Exists
  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
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
          eventAdmin: addTenantId(newEvent._id, args.data.organizationId),
          createdEvents: addTenantId(newEvent._id, args.data.organizationId),
          registeredEvents: addTenantId(newEvent._id, args.data.organizationId),
        },
      }
    );

    const members = org.members;
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const memberUser = await User.findOne({ _id: member });
      if (memberUser && memberUser.token) {
        await admin.messaging().send({
          token: memberUser.token,
          notification: {
            title: 'New Event',
            body: `${user.firstName} has created a new event in ${org.name}`,
          },
        });
      }
    }
    newEvent._doc._id = addTenantId(newEvent._id, args.data.organizationId);
    return {
      ...newEvent._doc,
    };
  }
  // If user hasen't joined or created the org then throw an error
  throw new UnauthorizedError(
    !IN_PRODUCTION
      ? ORGANIZATION_NOT_AUTHORIZED
      : requestContext.translate(ORGANIZATION_NOT_AUTHORIZED_MESSAGE),
    ORGANIZATION_NOT_AUTHORIZED_CODE,
    ORGANIZATION_NOT_AUTHORIZED_PARAM
  );
};

module.exports = createEvent;
