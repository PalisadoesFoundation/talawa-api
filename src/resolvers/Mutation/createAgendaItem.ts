import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Organization, AgendaItemModel } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_AUTHORIZED_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
import { Types } from "mongoose";
import { adminCheck, superAdminCheck } from "../../utilities";
import { user } from "../CheckIn/user";

/**
 * Create an agenda item based on the provided input.
 *
 * @param _parent - The parent of the current request.
 * @param args - The payload provided with the request.
 * @param context - The context of the entire application.
 * @throws {NotFoundError} - If the user, organization, or agenda category is not found.
 * @throws {UnauthorizedError} - If the user is not authorized to perform the operation.
 * @returns The created agenda item.
 */
export const createAgendaItem: MutationResolvers["createAgendaItem"] = async (
  _parent,
  args,
  context
) => {
  // Fetch the current user based on the provided createdBy ID
  const userId = context.userId || args.input.createdBy;
  const currentUser = await User.findOne({
    _id: userId,
  }).lean();

  // If the user is not found, throw a NotFoundError
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Fetch the organization based on the provided organization ID
  const organizationId = args.input.organization;
  const organization = await Organization.findOne({
    _id: organizationId?.toString(),
  }).lean();

  // If the organization is not found, throw a NotFoundError
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  const isEventAdmin = currentUser.eventAdmin.some(
    (eventId) => eventId === args.input.relatedEvent
  );

  // Perform authorization checks for the user
  const hasAdminPermissions =
    currentUser.adminFor.includes(organization) ||
    currentUser.userType === "SUPERADMIN";

  if (!hasAdminPermissions || isEventAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  // Check if the user has the required privileges for the organization
  const userCreatedOrganization = currentUser.createdOrganizations.some(
    (createdOrganization) => createdOrganization.equals(organization._id)
  );

  const userJoinedOrganization = currentUser.joinedOrganizations.some(
    (joinedOrganization) => joinedOrganization.equals(organization._id)
  );

  if (
    !(
      userCreatedOrganization ||
      userJoinedOrganization ||
      currentUser.userType === "SUPERADMIN"
    )
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(ORGANIZATION_NOT_AUTHORIZED_ERROR.MESSAGE),
      ORGANIZATION_NOT_AUTHORIZED_ERROR.CODE,
      ORGANIZATION_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  // Handle "Note" agenda item creation
  if (args.input.itemType === "Note") {
    const createdNoteAgendaItem = await createNoteAgendaItem(
      args.input,
      currentUser,
      organization
    );
    return createdNoteAgendaItem.toObject();
  }

  // If the item type is not "Note", create a regular agenda item
  const categoryId = args.input?.categories as string | undefined; // Type assertion
  const category = categoryId ? Types.ObjectId(categoryId) : undefined;

  const createdAgendaItem = await createRegularAgendaItem(
    args.input,
    currentUser,
    category
  );

  return createdAgendaItem.toObject();
};

/**
 * Create a "Note" agenda item based on the provided input.
 *
 * @param input - The input payload for creating a "Note" agenda item.
 * @param currentUser - The current user performing the operation.
 * @param organization - The organization associated with the agenda item.
 * @returns The created "Note" agenda item.
 */
async function createNoteAgendaItem(
  input: any,
  currentUser: any,
  organization: any
) {
  const createdNoteAgendaItem = await AgendaItemModel.create({
    description: input.description, // Add other relevant fields for "Note" items
    createdBy: currentUser._id,
    organization: organization._id,
    updatedAt: new Date(),
    createdAt: new Date(),
    isNote: true,
  });

  // Add the createdNoteAgendaItem._id to the appropriate lists on currentUser's document
  await updateUserAgendaItems(currentUser._id, createdNoteAgendaItem._id);

  return createdNoteAgendaItem;
}

/**
 * Create a regular agenda item based on the provided input.
 *
 * @param input - The input payload for creating a regular agenda item.
 * @param currentUser - The current user performing the operation.
 * @param category - The category associated with the agenda item.
 * @returns The created regular agenda item.
 */
async function createRegularAgendaItem(
  input: any,
  currentUser: any,
  category: any
) {
  const createdAgendaItem = await AgendaItemModel.create({
    ...input,
    createdBy: currentUser._id,
    category: category,
    updatedAt: new Date(),
    createdAt: new Date(),
  });

  // Add the createdAgendaItem._id to the appropriate lists on currentUser's document
  await updateUserAgendaItems(currentUser._id, createdAgendaItem._id);

  return createdAgendaItem;
}

/**
 * Update the lists of agenda items on the user's document.
 *
 * @param userId - The ID of the user.
 * @param agendaItemId - The ID of the agenda item to be added to the user's lists.
 */
async function updateUserAgendaItems(userId: string, agendaItemId: string) {
  await User.updateOne(
    {
      _id: userId,
    },
    {
      $push: {
        // Add relevant lists here based on your schema
        createdAgendaItems: agendaItemId,
      },
    }
  );
}
