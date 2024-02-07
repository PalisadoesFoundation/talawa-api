import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Organization } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_AUTHORIZED_ERROR,
  LENGTH_VALIDATION_ERROR,
} from "../../constants";
import { isValidString } from "../../libraries/validators/validateString";
import { compareDates } from "../../libraries/validators/compareDates";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { session } from "../../db";
import {
  createSingleEvent,
  createRecurringEvents,
  associateEventWithUser,
} from "../../helpers/event/createEventHelpers";

/**
 * This function enables to create an event.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following steps are followed:
 * 1. Check if the user exists
 * 2. Check if the organization exists
 * 3. Check if the user is a part of the organization.
 * 4. If the event is recurring, create the recurring event instances.
 * 5. If the event is non-recurring, create a single event.
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
    let createdEvent: InterfaceEvent;

    const { data } = args;

    if (args.data.recurring) {
      // generate recurring events upto a date limit,
      // leave the rest for the query

      // create recurring event instances
      const recurringEventInstances = await createRecurringEvents(
        data,
        currentUser?._id.toString(),
        organization?._id.toString(),
        session
      );

      // associate recurring event instances with the current user and cache them
      for (const recurringEventInstance of recurringEventInstances) {
        await associateEventWithUser(
          currentUser,
          recurringEventInstance,
          session
        );
        await cacheEvents([recurringEventInstance]);
      }

      createdEvent = recurringEventInstances[0];
    } else {
      // create a single non-recurring event
      createdEvent = await createSingleEvent(
        args,
        currentUser?._id.toString(),
        organization?._id.toString(),
        session
      );

      // associate event with the current user and cache it
      await associateEventWithUser(currentUser, createdEvent, session);
      await cacheEvents([createdEvent]);
    }

    if (session) {
      // commit transaction if everything's successful
      await session.commitTransaction();
    }

    // Returns the createdEvent.
    return createdEvent;
  } catch (error) {
    if (session) {
      // abort transaction if something fails
      await session.abortTransaction();
    }
    throw error;
  }
};
