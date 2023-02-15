import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Organization, Event } from "../../models";
import {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_AUTHORIZED_MESSAGE,
  ORGANIZATION_NOT_AUTHORIZED_CODE,
  ORGANIZATION_NOT_AUTHORIZED_PARAM,
  REGEX_VALIDATION_ERROR,
  LENGTH_VALIDATION_ERROR,
} from "../../constants";
import admin, { credential } from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { isValidString } from "../../libraries/validators/validateString";
import { compareDates } from "../../libraries/validators/compareDates";

const applicationDefault = credential.applicationDefault;

getApps().length === 0
  ? admin.initializeApp({ credential: applicationDefault() })
  : getApps();

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
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
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
      requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
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
      requestContext.translate(ORGANIZATION_NOT_AUTHORIZED_MESSAGE),
      ORGANIZATION_NOT_AUTHORIZED_CODE,
      ORGANIZATION_NOT_AUTHORIZED_PARAM
    );
  }

  // Checks if the recieved arguments are valid according to standard input norms
  const validationResult_Title = isValidString(args.data!.title, 256);
  const validationResult_Description = isValidString(
    args.data!.description,
    500
  );
  const validationResult_Location = isValidString(args.data!.location!, 50);
  if (!validationResult_Title.isFollowingPattern) {
    throw new errors.InputValidationError(
      requestContext.translate(`${REGEX_VALIDATION_ERROR.message} in title`),
      REGEX_VALIDATION_ERROR.code
    );
  }
  if (!validationResult_Title.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.message} 256 characters in title`
      ),
      LENGTH_VALIDATION_ERROR.code
    );
  }
  if (!validationResult_Description.isFollowingPattern) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${REGEX_VALIDATION_ERROR.message} in description`
      ),
      REGEX_VALIDATION_ERROR.code
    );
  }
  if (!validationResult_Description.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.message} 500 characters in description`
      ),
      LENGTH_VALIDATION_ERROR.code
    );
  }
  if (!validationResult_Location.isFollowingPattern) {
    throw new errors.InputValidationError(
      requestContext.translate(`${REGEX_VALIDATION_ERROR.message} in location`),
      REGEX_VALIDATION_ERROR.code
    );
  }
  if (!validationResult_Location.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.message} 50 characters in location`
      ),
      LENGTH_VALIDATION_ERROR.code
    );
  }
  const compareDatesResult = compareDates(
    args.data!.startDate,
    args.data!.endDate!
  );
  if (compareDatesResult !== "") {
    throw new errors.InputValidationError(
      requestContext.translate(compareDatesResult),
      compareDatesResult
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
