// import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
// import { errors, requestContext } from "../../libraries";
// import { AgendaCategoryModel, Organization, User } from "../../models";
// import {
//   USER_NOT_FOUND_ERROR,
//   ORGANIZATION_NOT_FOUND_ERROR,
//   USER_NOT_AUTHORIZED_ERROR,
// } from "../../constants";
// import { adminCheck, superAdminCheck } from "../../utilities";

// /**
//  * Resolver function for the GraphQL mutation 'createAgendaCategory'.
//  *
//  * This resolver creates a new agenda category, associates it with an organization,
//  * and updates the organization with the new agenda category.
//  *
//  * @param {Object} _parent - The parent object, not used in this resolver.
//  * @param {Object} args - The input arguments for the mutation.
//  * @param {Object} context - The context object containing user information.
//  * @returns {Promise<Object>} A promise that resolves to the created agenda category.
//  * @throws {NotFoundError} Throws an error if the user or organization is not found.
//  * @throws {UnauthorizedError} Throws an error if the user does not have the required permissions.
//  * @throws {InternalServerError} Throws an error for other potential issues during agenda category creation.
//  */
// export const createAgendaCategory: MutationResolvers["createAgendaCategory"] =
//   async (_parent, args, context) => {
//     // Find the current user based on the provided createdBy ID or use the context userId

//     const userId = context.userId;

//     const currentUser = await User.findById(userId).lean();

//     if (!currentUser) {
//       throw new errors.NotFoundError(
//         requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
//         USER_NOT_FOUND_ERROR.CODE,
//         USER_NOT_FOUND_ERROR.PARAM
//       );
//     }
//     // Check if the organization exists
//     const relatedOrganization = await Organization.findById(
//       args.input.organization
//     ).lean();

//     // If the organization is not found, throw a NotFoundError
//     if (!relatedOrganization) {
//       throw new errors.NotFoundError(
//         ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
//         ORGANIZATION_NOT_FOUND_ERROR.CODE,
//         ORGANIZATION_NOT_FOUND_ERROR.PARAM
//       );
//     }

//     // Check if the current user has the necessary permissions
//     await adminCheck(context.userId, relatedOrganization);
//     // Create a new AgendaCategory using the Mongoose model
//     const createdAgendaCategory = await AgendaCategoryModel.create({
//       ...args.input,
//       createdBy: currentUser?._id,
//       createdAt: new Date(),
//     });
//     await Organization.findByIdAndUpdate(
//       relatedOrganization._id,
//       {
//         $push: {
//           agendaCategories: createdAgendaCategory,
//         },
//       },
//       { new: true }
//     );
//     return createdAgendaCategory.toObject();
//   };
