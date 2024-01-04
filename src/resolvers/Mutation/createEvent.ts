import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Organization, Event } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_AUTHORIZED_ERROR,
  LENGTH_VALIDATION_ERROR,
} from "../../constants";
import { isValidString } from "../../libraries/validators/validateString";
import { compareDates } from "../../libraries/validators/compareDates";
import { EventAttendee } from "../../models/EventAttendee";
import { cacheEvents } from "../../services/EventCache/cacheEvents";

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
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const organization = await Organization.findOne({
    _id: args.data?.organizationId,
  }).lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  const userCreatedOrganization = currentUser.createdOrganizations.some(
    (createdOrganization) => createdOrganization.equals(organization._id)
  );

  const userJoinedOrganization = currentUser.joinedOrganizations.some(
    (joinedOrganization) => joinedOrganization.equals(organization._id)
  );

  // Checks whether currentUser neither created nor joined the organization.
  if (
    !(
      userCreatedOrganization ||
      userJoinedOrganization ||
      currentUser.userType == "SUPERADMIN"
    )
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(ORGANIZATION_NOT_AUTHORIZED_ERROR.MESSAGE),
      ORGANIZATION_NOT_AUTHORIZED_ERROR.CODE,
      ORGANIZATION_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  // Checks if the recieved arguments are valid according to standard input norms
  const validationResultTitle = isValidString(args.data?.title ?? "", 256);
  const validationResultDescription = isValidString(
    args.data?.description ?? "",
    500
  );
  const validationResultLocation = isValidString(args.data?.location ?? "", 50);
  if (!validationResultTitle.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`
      ),
      LENGTH_VALIDATION_ERROR.CODE
    );
  }
  if (!validationResultDescription.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in description`
      ),
      LENGTH_VALIDATION_ERROR.CODE
    );
  }
  if (!validationResultLocation.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 50 characters in location`
      ),
      LENGTH_VALIDATION_ERROR.CODE
    );
  }
  const compareDatesResult = compareDates(
    args.data?.startDate,
    args.data?.endDate
  );
  if (compareDatesResult !== "") {
    throw new errors.InputValidationError(
      requestContext.translate(compareDatesResult),
      compareDatesResult
    );
  }

  let createdEvent;

  if (
    !args.data?.recurring ||
    (args.data?.recurring && args.data?.recurrance == "ONCE")
  ) {
    createdEvent = await Event.create({
      ...args.data,
      creator: currentUser._id,
      admins: [currentUser._id],
      organization: organization._id,
    });

    if (createdEvent !== null) {
      await cacheEvents([createdEvent]);
    }

    await associateEventWithUser(currentUser, createdEvent);

    return createdEvent.toObject();
  }

  if (args.data?.recurring && args.data?.recurrance == "WEEKLY") {
    createdEvent = await generateWeeklyRecurringInstances(
      args,
      currentUser,
      organization
    );
  }

  /* Commenting out this notification code coz we don't use firebase anymore.

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
     */
  if (!createdEvent) {
    throw new Error(requestContext.translate("Failed to create event!")); // Adjust the error message accordingly
  }

  // Returns the createdEvent.
  return createdEvent[0].toObject();
};

export async function associateEventWithUser(
  currentUser: any,
  createdEvent: any
) {
  await EventAttendee.create({
    userId: currentUser._id.toString(),
    eventId: createdEvent._id,
  });

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
}

export async function generateWeeklyRecurringInstances(
  args: any,
  currentUser: any,
  organization: any
) {
  const createdEvents = [];
  const { data } = args;

  const startDate = new Date(data?.startDate);
  const endDate = new Date(data?.endDate);

  while (startDate <= endDate) {
    const recurringEventData = {
      ...data,
      startDate,
    };

    const createdEvent = await Event.create({
      ...recurringEventData,
      creator: currentUser._id,
      admins: [currentUser._id],
      organization: organization._id,
    });

    createdEvents.push(createdEvent);

    await associateEventWithUser(currentUser, createdEvent);

    if (createdEvent !== null) {
      await cacheEvents([createdEvent]);
    }

    startDate.setDate(startDate.getDate() + 7);
  }

  return createdEvents;
}
