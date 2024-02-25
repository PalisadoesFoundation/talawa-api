// import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
// import { errors, requestContext } from "../../libraries";
// import { User, Organization, AgendaItemModel,Event } from "../../models";
// import {
//   USER_NOT_FOUND_ERROR,
//   ORGANIZATION_NOT_FOUND_ERROR,
//   USER_NOT_AUTHORIZED_ERROR,
// } from "../../constants";
// import { Types } from "mongoose";
// import { adminCheck, superAdminCheck } from "../../utilities";

// /**
//  * Create an agenda item based on the provided input.
//  *
//  * @param _parent - The parent of the current request.
//  * @param args - The payload provided with the request.
//  * @param context - The context of the entire application.
//  * @throws {NotFoundError} - If the user, organization, or agenda category is not found.
//  * @throws {UnauthorizedError} - If the user is not authorized to perform the operation.
//  * @returns The created agenda item.
//  */
// export const createAgendaItem: MutationResolvers["createAgendaItem"] = async (
//   _parent,
//   args,
//   context
// ) => {
//   const userId = context.userId;

//   const currentUser = await User.findById(userId).lean();

//   if (!currentUser) {
//     throw new errors.NotFoundError(
//       requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
//       USER_NOT_FOUND_ERROR.CODE,
//       USER_NOT_FOUND_ERROR.PARAM
//     );
//   }
//   const organizationFoundInCache = await findOrganizationsInCache([
//     args.input.organizationId,
//   ]);

//   const organization =
//     organizationFoundInCache[0] ||
//     (await Organization.findOne({
//       _id: args.input.organizationId,
//     }).lean());

//   if (organizationFoundInCache[0] == null && organization) {
//     await cacheOrganizations([organization]);
//   }

//   // Checks whether the organization with _id === args.organizationId exists.
//   if (!organization) {
//     throw new errors.NotFoundError(
//       requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
//       ORGANIZATION_NOT_FOUND_ERROR.CODE,
//       ORGANIZATION_NOT_FOUND_ERROR.PARAM,
//     );
//   }

//   const isEventAdmin = currentUser.eventAdmin.some(
//     (eventId) => eventId.toString() === args.input.relatedEventId
//   );

//   const hasAdminPermissions =
//     currentUser.adminFor.includes(organizationId) ||
//     currentUser.userType === "SUPERADMIN";

//   if (!hasAdminPermissions || isEventAdmin) {
//     throw new errors.UnauthorizedError(
//       requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
//       USER_NOT_AUTHORIZED_ERROR.CODE,
//       USER_NOT_AUTHORIZED_ERROR.PARAM
//     );
//   }

//   const categoryId = args.input?.categories as string | undefined;
//   const category = categoryId ? Types.ObjectId(categoryId) : undefined;

//   const createdAgendaItem = await AgendaItemModel.create({
//     ...args.input,
//     createdBy: currentUser._id,
//     category: category,
//     updatedAt: new Date(),
//     createdAt: new Date(),
//   });

//    const eventId = args.input.relatedEventId;

//   await Event.findByIdAndUpdate(
//     {
//       _id: eventId,
//     },
//     {
//       $push: {
//         agendaItems : createAgendaItem,
//       },
//     },
//     { new: true },
//   );
//   return createdAgendaItem.toObject();
// };

// /**
//  * Update the lists of agenda items on the user's document.
//  *
//  * @param userId - The ID of the user.
//  * @param agendaItemId - The ID of the agenda item to be added to the user's lists.
//  */
