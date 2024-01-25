import type {
  MutationResolvers,
  RruleField,
} from "../../types/generatedGraphQLTypes";
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
import { RRule } from "rrule";
import { addYears, format } from "date-fns";

/**
 * This function enables to create dynamically create events.
 *
 * This mutation allows users to create a new event with recurrence support.
 * Recurrence is managed using the `rrule` library.
 *
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists
 * 3. If the user is a part of the organization.
 *
 * Workflow
 *
 * 1. Validate input parameters.
 * 2. Generate recurrence rule (`rrule`) based on recurrence type and options.
 * 3. Create a new event object with the generated recurrence rule.
 * 4. Save the event to the database, storing only a single instance for recurring events.
 * 5. Return the created event details, including the recurrence rule.
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

  //Get Date at 100 years from now
  const currentDate = new Date();
  const specificEndDate = addYears(currentDate, 100);
  specificEndDate.setUTCHours(0, 0, 0, 0);

  const { data } = args;
  const startDate = new Date(data?.startDate);
  const endDate = !isNaN(data?.endDate) ? data?.endDate : specificEndDate;

  // Check if the end date is greater than 100 years from the current date
  if (endDate > specificEndDate) {
    throw new errors.InputValidationError(
      `End date cannot be greater than the ${format(
        specificEndDate,
        "MMM dd yyyy"
      )}`
    );
  }

  // Create recurring rule based on recurrence type
  let rule: RRule = new RRule();

  switch (data?.recurrance) {
    case "ONCE": {
      rule = new RRule({
        freq: RRule.DAILY,
        dtstart: startDate,
        until: endDate,
        count: 1,
      });

      break;
    }

    case "DAILY": {
      rule = new RRule({
        freq: RRule.DAILY,
        dtstart: startDate,
        until: endDate,
      });

      break;
    }

    case "WEEKLY": {
      rule = new RRule({
        freq: RRule.WEEKLY,
        dtstart: startDate,
        until: endDate,
      });

      break;
    }

    case "MONTHLY": {
      const weekdayNumeric = startDate.getDay();
      const dayOfMonth = startDate.getUTCDate();
      const occurrence = Math.floor((dayOfMonth - 1) / 7) + 1;

      const weekdays = [
        RRule.SU,
        RRule.MO,
        RRule.TU,
        RRule.WE,
        RRule.TH,
        RRule.FR,
        RRule.SA,
      ];

      rule = new RRule({
        freq: RRule.MONTHLY,
        dtstart: startDate,
        until: endDate,
        byweekday: [
          weekdays[weekdayNumeric].nth(occurrence < 5 ? occurrence : -1),
        ],
      });

      break;
    }

    case "YEARLY": {
      rule = new RRule({
        freq: RRule.YEARLY,
        dtstart: startDate,
        until: endDate,
      });

      break;
    }
  }

  //Construct rrlue object to store in database
  const rrulefield: RruleField = {
    dtstart: rule.options.dtstart,
    until: rule.options.until,
    frequency: rule.options.freq,
    count: rule.options.count,
    byweekday: rule.options.bynweekday?.[0][0],
    weekdayOccurence: rule.options.bynweekday?.[0][1],
    //More feild can be added when dealing with custom event
  };

  // Create and cache the event with the generated recurrence rule
  const createdEvent = await Event.create({
    ...args.data,
    endDate: endDate,
    rruleObject: rrulefield,
    creatorId: currentUser._id,
    admins: [currentUser._id],
    organization: organization._id,
  });

  if (createdEvent !== null) {
    await cacheEvents([createdEvent]);
  }

  // Create an event attendee entry
  await EventAttendee.create({
    userId: currentUser._id.toString(),
    eventId: createdEvent._id,
  });

  // Update user's document with created event
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

  // Return the created event
  return createdEvent.toObject();
};
