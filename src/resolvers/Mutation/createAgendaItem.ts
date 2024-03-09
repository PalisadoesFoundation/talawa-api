import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Organization, AgendaItemModel, Event } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  EVENT_NOT_FOUND_ERROR,
} from "../../constants";
import { Types } from "mongoose";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
/**
 * Create an agenda item based on the provided input.
 *
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @returns The created agenda item.
 */
export const createAgendaItem: MutationResolvers["createAgendaItem"] = async (
  _parent,
  args,
  context,
) => {
  const userId = context.userId;

  const currentUser = await User.findById(userId).lean();

  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  const organizationFoundInCache = await findOrganizationsInCache([
    args.input.organizationId,
  ]);

  const organization =
    organizationFoundInCache[0] ||
    (await Organization.findOne({
      _id: args.input.organizationId,
    }).lean());

  if (organizationFoundInCache[0] == null && organization) {
    await cacheOrganizations([organization]);
  }

  // Checks whether the organization with _id === args.organizationId exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  let currentUserIsEventAdmin = false;

  if (args.input.relatedEventId) {
    let currEvent: InterfaceEvent | null;

    const eventFoundInCache = await findEventsInCache([
      args.input.relatedEventId,
    ]);

    currEvent = eventFoundInCache[0];

    if (eventFoundInCache[0] === null) {
      currEvent = await Event.findOne({
        _id: args.input.relatedEventId,
      }).lean();

      if (currEvent !== null) {
        await cacheEvents([currEvent]);
      }
    }

    // Checks whether currEvent exists.
    if (!currEvent) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks if the currUser is an admin of the event
    currentUserIsEventAdmin = currEvent.admins.some(
      (admin) =>
        admin === context.userID ||
        Types.ObjectId(admin).equals(context.userId),
    );
  }

  // Checks if the currUser is an admin of the organization
  const currentUserIsOrgAdmin = currentUser.adminFor.some(
    (ogranizationId) =>
      ogranizationId === args.input.organizationId ||
      Types.ObjectId(ogranizationId).equals(args.input.organizationId),
  );

  // Checks whether currentUser with _id === context.userId is authorized for the operation.
  if (
    currentUserIsEventAdmin === false &&
    currentUserIsOrgAdmin === false &&
    currentUser.userType !== "SUPERADMIN"
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  const createdAgendaItem = await AgendaItemModel.create({
    ...args.input,
    createdBy: currentUser._id,
    relatedEventId: args.input.relatedEventId,
    updatedAt: new Date(),
    createdAt: new Date(),
  });

  await Event.findByIdAndUpdate(
    {
      _id: args.input.relatedEventId,
    },
    {
      $push: {
        agendaItems: createdAgendaItem,
      },
    },
    { new: true },
  );
  return createdAgendaItem.toObject();
};
