import { Types } from "mongoose";
import {
  LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";

import { session } from "../../db";
import {
  createRecurringEvent,
  createSingleEvent,
} from "../../helpers/event/createEventHelpers";
import { errors, requestContext } from "../../libraries";
import { compareDates } from "../../libraries/validators/compareDates";
import { isValidString } from "../../libraries/validators/validateString";
import type {
  InterfaceAppUserProfile,
  InterfaceEvent,
  InterfaceUser,
} from "../../models";
import { AppUserProfile, Organization, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Creates a new event and associates it with an organization.
 *
 * This resolver handles both recurring and non-recurring events, performing the following steps:
 *
 * 1. Validates the existence of the user, their app user profile, and the associated organization.
 * 2. Checks if the user is authorized to create an event in the organization.
 * 3. Validates the provided event details, including title, description, location, and date range.
 * 4. Creates the event using the appropriate method based on whether it's recurring or not.
 * 5. Uses a database transaction to ensure data consistency.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation, including:
 *   - `data`: An object containing:
 *     - `organizationId`: The ID of the organization to associate with the event.
 *     - `title`: The title of the event (max 256 characters).
 *     - `description`: A description of the event (max 500 characters).
 *     - `location`: The location of the event (max 50 characters).
 *     - `startDate`: The start date of the event.
 *     - `endDate`: The end date of the event.
 *     - `recurring`: A boolean indicating if the event is recurring.
 * @param context - The context object containing user information (context.userId).
 *
 * @returns A promise that resolves to the created event object.
 *
 * @remarks This function uses a transaction to ensure that either all operations succeed or none do, maintaining data integrity.
 */
export const createEvent: MutationResolvers["createEvent"] = async (
  _parent,
  args,
  context,
) => {
  let currentUser: InterfaceUser | null;
  const userFoundInCache = await findUserInCache([context.userId]);
  currentUser = userFoundInCache[0];
  if (currentUser === null) {
    currentUser = await User.findOne({
      _id: context.userId,
    }).lean();
    if (currentUser !== null) {
      await cacheUsers([currentUser]);
    }
  }

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  let currentUserAppProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    currentUser.appUserProfileId?.toString(),
  ]);
  currentUserAppProfile = appUserProfileFoundInCache[0];
  if (currentUserAppProfile === null) {
    currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (currentUserAppProfile !== null) {
      await cacheAppUserProfile([currentUserAppProfile]);
    }
  }

  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  const organization = await Organization.findOne({
    _id: args.data.organizationId.startsWith("id=")
      ? args.data.organizationId.toString().substring(3)
      : args.data.organizationId,
  }).lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  const isUserOrgAdmin = currentUserAppProfile.adminFor.some((org) =>
    new Types.ObjectId(org?.toString()).equals(organization._id),
  );

  const isUserOrgMember = currentUser.joinedOrganizations.some(
    (joinedOrganization) => joinedOrganization.equals(organization._id),
  );

  // Checks whether currentUser neither created nor joined the organization.

  if (
    !(isUserOrgAdmin || isUserOrgMember || currentUserAppProfile.isSuperAdmin)
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Checks if the received arguments are valid according to standard input norms
  const validationResultTitle = isValidString(args.data?.title ?? "", 256);
  const validationResultDescription = isValidString(
    args.data?.description ?? "",
    500,
  );
  const validationResultLocation = isValidString(args.data?.location ?? "", 50);
  if (!validationResultTitle.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`,
      ),
      LENGTH_VALIDATION_ERROR.CODE,
    );
  }
  if (!validationResultDescription.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in description`,
      ),
      LENGTH_VALIDATION_ERROR.CODE,
    );
  }
  if (!validationResultLocation.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 50 characters in location`,
      ),
      LENGTH_VALIDATION_ERROR.CODE,
    );
  }
  const compareDatesResult = compareDates(
    args.data?.startDate,
    args.data?.endDate,
  );
  if (compareDatesResult !== "") {
    throw new errors.InputValidationError(
      requestContext.translate(compareDatesResult),
      compareDatesResult,
    );
  }

  /* c8 ignore start */
  if (session) {
    // start a transaction
    session.startTransaction();
  }

  /* c8 ignore stop */
  try {
    let createdEvent: InterfaceEvent;

    if (args.data.recurring) {
      // create recurring event instances
      createdEvent = await createRecurringEvent(
        args,
        currentUser?._id.toString(),
        organization?._id.toString(),
        session,
      );
    } else {
      // create a single non-recurring event
      createdEvent = await createSingleEvent(
        args,
        currentUser?._id.toString(),
        organization?._id.toString(),
        session,
      );
    }

    /* c8 ignore start */
    if (session) {
      // commit transaction if everything's successful
      await session.commitTransaction();
    }

    /* c8 ignore stop */

    return createdEvent;

    /* c8 ignore start */
  } catch (error) {
    if (session) {
      // abort transaction if something fails
      await session.abortTransaction();
    }

    throw error;
  }

  /* c8 ignore stop */
};
