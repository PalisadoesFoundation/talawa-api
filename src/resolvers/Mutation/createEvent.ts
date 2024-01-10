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
import type mongoose from "mongoose";
import { session } from "../../db";
import {
  generateSingleEvent,
  generateWeeklyEvents,
} from "../../helpers/eventInstance";

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

  if (session) {
    session.startTransaction();
  }

  try {
    let createdEvent!: any;

    if (args.data?.recurring) {
      switch (args.data?.recurrance) {
        case "ONCE":
          createdEvent = await generateSingleEvent(
            args,
            currentUser,
            organization,
            session
          );

          for (const event of createdEvent) {
            await associateEventWithUser(currentUser, event, session);
            await cacheEvents([event]);
          }

          break;

        case "WEEKLY":
          createdEvent = await generateWeeklyEvents(
            args,
            currentUser,
            organization,
            session
          );

          for (const event of createdEvent) {
            await associateEventWithUser(currentUser, event, session);
            await cacheEvents([event]);
          }

          break;
      }
    } else {
      createdEvent = await generateSingleEvent(
        args,
        currentUser,
        organization,
        session
      );

      for (const event of createdEvent) {
        await associateEventWithUser(currentUser, event, session);
        await cacheEvents([event]);
      }
    }

    if (session) {
      await session.commitTransaction();
    }

    // Returns the createdEvent.
    return createdEvent[0].toObject();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
};

async function associateEventWithUser(
  currentUser: any,
  createdEvent: any,
  session: mongoose.ClientSession
) {
  await EventAttendee.create(
    [
      {
        userId: currentUser._id.toString(),
        eventId: createdEvent._id,
      },
    ],
    { session }
  );

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
    },
    { session }
  );
}
