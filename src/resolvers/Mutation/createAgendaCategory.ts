import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { AgendaCategoryModel, Organization, User } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
import { adminCheck, superAdminCheck } from "../../utilities";

/**
 * Resolver function for the GraphQL mutation 'createAgendaCategory'.
 *
 * This resolver creates a new agenda category, associates it with an organization,
 * and updates the organization with the new agenda category.
 *
 * @param {Object} _parent - The parent object, not used in this resolver.
 * @param {Object} args - The input arguments for the mutation.
 * @param {Object} context - The context object containing user information.
 * @returns {Promise<Object>} A promise that resolves to the created agenda category.
 * @throws {NotFoundError} Throws an error if the user or organization is not found.
 * @throws {UnauthorizedError} Throws an error if the user does not have the required permissions.
 * @throws {InternalServerError} Throws an error for other potential issues during agenda category creation.
 */
export const createAgendaCategory: MutationResolvers["createAgendaCategory"] =
  async (_parent, args, context) => {
    // Find the current user based on the provided createdBy ID or use the context userId
    const createdByUserId = args.input.createdBy;

    // Ensure createdByUserId is a valid non-null value
    if (!createdByUserId) {
      throw new Error("Invalid or missing createdBy user ID");
    }

    // Fetch the current user
    const createdByUser = await User.findOne({
      _id: createdByUserId,
    }).lean();

    // If the user is not found, throw a NotFoundError
    if (!createdByUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    // Check if the organization exists
    const organization = await Organization.findById(
      args.input.organizationId
    ).lean();

    // If the organization is not found, throw a NotFoundError
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    // Check if the current user has the necessary permissions
    const hasAdminPermissions =
      createdByUser.adminFor.includes(organization._id) ||
      createdByUser.userType === "SUPERADMIN";

    if (!hasAdminPermissions) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    // Create a new AgendaCategory using the Mongoose model
    const createdAgendaCategory = await AgendaCategoryModel.create({
      ...args.input,
      organization: organization._id,
      createdBy: createdByUser._id,
      updatedBy: createdByUser._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Fetch the populated AgendaCategory
    const populatedAgendaCategory = await AgendaCategoryModel.findById(
      createdAgendaCategory._id
    )
      .populate("createdBy")
      .lean();

    // Update the organization with the new AgendaCategory
    await Organization.findByIdAndUpdate(
      organization._id,
      {
        $push: {
          agendaCategories: populatedAgendaCategory,
        },
      },
      { new: true }
    );

    return createdAgendaCategory.toObject(); // Return as a plain JavaScript object
  };
