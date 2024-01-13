import { organization } from "./../DirectChat/organization";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Organization, Event } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_AUTHORIZED_ERROR,
  LENGTH_VALIDATION_ERROR,
  VENUE_ALREADY_SCHEDULED,
  VENUE_DOESNT_EXIST_ERROR,
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
  // Checks if the venue is provided and whether that venue exists in the organization
  if (
    args.data?.venue &&
    organization.venues?.some((venue) => venue._id.equals(args.data?.venue))
  ) {
    const conflictingEvents = await Event.find({
      organization: args.data?.organizationId,
      venue: args.data?.venue ?? "",
      $or: [
        {
          $and: [
            { startDate: { $lte: args.data?.startDate } },
            { endDate: { $gte: args.data?.startDate } },
          ],
        },
        {
          $and: [
            { startDate: { $lte: args.data?.endDate } },
            { endDate: { $gte: args.data?.endDate } },
          ],
        },
        {
          $and: [
            { startDate: { $gte: args.data?.startDate } },
            { endDate: { $lte: args.data?.endDate } },
          ],
        },
        {
          $and: [
            { startDate: { $lte: args.data?.startDate } },
            { endDate: { $gte: args.data?.endDate } },
          ],
        },
      ],
      $and: [
        {
          $or: [
            {
              allDay: true,
            },
            {
              $and: [
                { startTime: { $lte: args.data?.startTime } },
                { endTime: { $gte: args.data?.startTime } },
              ],
            },
            {
              $and: [
                { startTime: { $lte: args.data?.endTime } },
                { endTime: { $gte: args.data?.endTime } },
              ],
            },
            {
              $and: [
                { startTime: { $gte: args.data?.startTime } },
                { endTime: { $lte: args.data?.endTime } },
              ],
            },
            {
              $and: [
                { startTime: { $lte: args.data?.startTime } },
                { endTime: { $gte: args.data?.endTime } },
              ],
            },
          ],
        },
      ],
    });

    if (conflictingEvents.length > 0) {
      const conflictDetails = conflictingEvents.map((event) => ({
        _id: event._id,
        title: event.title,
        description: event.description,
        allDay: event.allDay,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
      }));
      throw new errors.ConflictError(
        requestContext.translate(VENUE_ALREADY_SCHEDULED.MESSAGE),
        VENUE_ALREADY_SCHEDULED.CODE,
        VENUE_ALREADY_SCHEDULED.PARAM
      );
    }
  } else if (args.data?.venue) {
    throw new errors.NotFoundError(
      requestContext.translate(VENUE_DOESNT_EXIST_ERROR.MESSAGE),
      VENUE_DOESNT_EXIST_ERROR.CODE,
      VENUE_DOESNT_EXIST_ERROR.PARAM
    );
  }
  // Creates new event.
  const createdEvent = await Event.create({
    ...args.data,
    creator: currentUser._id,
    admins: [currentUser._id],
    organization: organization._id,
  });

  if (createdEvent !== null) {
    await cacheEvents([createdEvent]);
  }

  await EventAttendee.create({
    userId: currentUser._id.toString(),
    eventId: createdEvent._id,
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

  // Returns the createdEvent.
  return createdEvent.toObject();
};
