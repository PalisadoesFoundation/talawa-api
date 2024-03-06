import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_ALREADY_REGISTERED_FOR_EVENT,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Event, EventAttendee } from "../../models";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { Types } from "mongoose";

export const addEventAttendee: MutationResolvers["addEventAttendee"] = async (
  _parent,
  args,
  context,
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  let event: InterfaceEvent | null;
  const eventFoundInCache = await findEventsInCache([args.data.eventId]);

  event = eventFoundInCache[0];

  if (eventFoundInCache[0] === null) {
    event = await Event.findOne({
      _id: args.data.eventId,
    }).lean();

    if (event !== null) {
      await cacheEvents([event]);
    }
  }

  if (event === null) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM,
    );
  }

  const isUserEventAdmin = event.admins.some(
    (admin) =>
      admin === context.userID || Types.ObjectId(admin).equals(context.userId),
  );

  if (!isUserEventAdmin && currentUser.userType !== "SUPERADMIN") {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  const requestUser = await User.findOne({
    _id: args.data.userId,
  }).lean();

  if (requestUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  const userAlreadyAttendee = await EventAttendee.exists({
    ...args.data,
  });

  if (userAlreadyAttendee) {
    throw new errors.ConflictError(
      requestContext.translate(USER_ALREADY_REGISTERED_FOR_EVENT.MESSAGE),
      USER_ALREADY_REGISTERED_FOR_EVENT.CODE,
      USER_ALREADY_REGISTERED_FOR_EVENT.PARAM,
    );
  }

  const currentUserIsOrganizationMember =
    currentUser.joinedOrganizations.includes(requestUser.joinedOrganizations);

  if (
    process.env.SKIP_ORG_MEMBER_CHECK_TEST !== "true" &&
    !currentUserIsOrganizationMember
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE),
      USER_NOT_MEMBER_FOR_ORGANIZATION.CODE,
      USER_NOT_MEMBER_FOR_ORGANIZATION.PARAM,
    );
  }

  await EventAttendee.create({ ...args.data });

  return requestUser;
};
