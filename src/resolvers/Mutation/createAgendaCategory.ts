// import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
// import { errors, requestContext } from "../../libraries";
// import {
//   AgendaCategoryModel,
//   InterfaceAgendaCategory,
//   Organization,
//   User,
// } from "../../models";
// import {
//   USER_NOT_FOUND_ERROR,
//   ORGANIZATION_NOT_FOUND_ERROR,
//   USER_NOT_AUTHORIZED_ERROR,
// } from "../../constants";
// import { adminCheck, superAdminCheck } from "../../utilities";
// import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
// import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
// /* eslint-disable */
// /**
//  * Resolver function for the GraphQL mutation 'createAgendaCategory'.
//  *
//  * This resolver creates a new agenda category, associates it with an organization,
//  * and updates the organization with the new agenda category.
//  *
//  *
//  *
//  *
//  * @returns {Promise<InterfaceAgendaCategory>} A promise that resolves to the created agenda category.
//  * @throws {NotFoundError} Throws an error if the user or organization is not found.
//  * @throws {UnauthorizedError} Throws an error if the user does not have the required permissions.
//  * @throws {InternalServerError} Throws an error for other potential issues during agenda category creation.
//  */
// /* eslint-enable */
// export const createAgendaCategory: MutationResolvers["createAgendaCategory"] =
//   async (_parent, args, context)  => {
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

//     const organizationFoundInCache = await findOrganizationsInCache([
//       args.input.organization,
//     ]);

//     const organization =
//       organizationFoundInCache[0] ||
//       (await Organization.findOne({
//         _id: args.input.organization,
//       }).lean());

//     if (organizationFoundInCache[0] == null && organization) {
//       await cacheOrganizations([organization]);
//     }

//     // Checks whether the organization with _id === args.organizationId exists.
//     if (!organization) {
//       throw new errors.NotFoundError(
//         requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
//         ORGANIZATION_NOT_FOUND_ERROR.CODE,
//         ORGANIZATION_NOT_FOUND_ERROR.PARAM
//       );
//     }

//     // Checks whether the user is authorized to perform the operation
//     await adminCheck(context.userId, organization);

//     // Create a new AgendaCategory using the Mongoose model
//     const createdAgendaCategory = await AgendaCategoryModel.create({
//       ...args.input,
//       createdBy: currentUser?._id,
//       createdAt: new Date(),
//     });
//     await Organization.findByIdAndUpdate(
//       organization._id,
//       {
//         $push: {
//           agendaCategories: createdAgendaCategory,
//         },
//       },
//       { new: true }
//     );
//     return createdAgendaCategory.toObject();
//   };
