import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { AgendaCategoryModel, AppUserProfile, User } from "../../models";
import {
  AGENDA_CATEGORY_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { Types } from "mongoose";
/**
 * This is a resolver function for the GraphQL mutation 'deleteAgendaCategory'.
 *
 * This resolver deletes an agenda category if the user has the necessary permissions.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation.
 * @returns A promise that resolves to the ID of the deleted agenda category.
 * @throws `NotFoundError` If the user or agenda category is not found.
 * @throws `UnauthorizedError` If the user does not have the required permissions.
 * @throws `InternalServerError` For other potential issues during agenda category deletion.
 */

export const deleteAgendaCategory: MutationResolvers["deleteAgendaCategory"] =
  async (_parent, args, context) => {
    const categoryId = args.id;
    const agendaCategory = await AgendaCategoryModel.findById(args.id);

    const userId = context.userId;

    // Fetch the user to get the organization ID
    const currentUser = await User.findById(userId);

    // If the user is not found, throw a NotFoundError
    if (!currentUser) {
      throw new errors.NotFoundError(
        USER_NOT_FOUND_ERROR.MESSAGE,
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const currentAppUserProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (!currentAppUserProfile) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    if (!agendaCategory) {
      throw new errors.NotFoundError(
        AGENDA_CATEGORY_NOT_FOUND_ERROR.MESSAGE,
        AGENDA_CATEGORY_NOT_FOUND_ERROR.CODE,
        AGENDA_CATEGORY_NOT_FOUND_ERROR.PARAM,
      );
    }

    const currentOrg = await AgendaCategoryModel.findById(agendaCategory._id)
      .select("organizationId")
      .lean();

    const currentOrgId = currentOrg?.organizationId?.toString() || "";

    const currentUserIsOrgAdmin = currentAppUserProfile.adminFor.some(
      (organizationId) =>
        new Types.ObjectId(organizationId?.toString()).equals(currentOrgId),
    );
    // If the user is a normal user, throw an error
    if (
      currentUserIsOrgAdmin === false &&
      currentAppUserProfile.isSuperAdmin === false
    ) {
      throw new errors.UnauthorizedError(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    await AgendaCategoryModel.findByIdAndDelete(args.id);
    return categoryId;
  };
