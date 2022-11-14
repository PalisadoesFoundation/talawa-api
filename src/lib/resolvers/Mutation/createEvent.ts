import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { User, Organization, Event } from "../../models";
import {
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
} from "../../../constants";
import admin, { credential } from "firebase-admin";

const applicationDefault = credential.applicationDefault;

admin.initializeApp({ credential: applicationDefault() });
/**
 * This function enables to create an event.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists
 * 3. If the user is a part of the organization.
 * @returns Created event
 */
export const createEvent: MutationResolvers["createEvent"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const organization = await Organization.findOne({
    _id: args.data!.organizationId,
  }).lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  const userCreatedOrganization = currentUser.createdOrganizations.some(
    (createdOrganization) =>
      createdOrganization.toString() === organization._id.toString()
  );

  const userJoinedOrganization = currentUser.joinedOrganizations.some(
    (joinedOrganization) =>
      joinedOrganization.toString() === organization._id.toString()
  );

  // Checks whether currentUser neither created nor joined the organization.
  if (!(userCreatedOrganization || userJoinedOrganization)) {
    throw new errors.UnauthorizedError(
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_AUTHORIZED
        : requestContext.translate(ORGANIZATION_NOT_AUTHORIZED_MESSAGE),
      ORGANIZATION_NOT_AUTHORIZED_CODE,
      ORGANIZATION_NOT_AUTHORIZED_PARAM
    );
  }

  // Creates new event.
  const createdEvent = await Event.create({
    ...args.data,
    creator: currentUser._id,
    registrants: [
      {
        userId: currentUser._id.toString(),
        user: currentUser._id,
      },
    ],
    admins: [currentUser._id],
    organization: organization._id,
  });

  /*
  Adds createdEvent._id to eventAdmin, createdEvents and registeredEvents lists
  on currentUser's document.
  */
  await User.updateOne(
    {
      _id: currentUser._id,
    },
    {
      $push: {
        eventAdmin: createdEvent._id,
        createdEvents: createdEvent._id,
        registeredEvents: createdEvent._id,
      },
    }
  );

  for (let i = 0; i < organization.members.length; i++) {
    const user = await User.findOne({
      _id: organization.members[i],
    }).lean();

    // Checks whether both user and user.token exist.
    if (user && user.token) {
      await admin.messaging().send({
        token: user.token,
        notification: {
          title: "New Event",
          body: `${currentUser.firstName} has created a new event in ${organization.name}`,
        },
      });
    }
  }

  // Returns the createdEvent.
  return createdEvent.toObject();
};
