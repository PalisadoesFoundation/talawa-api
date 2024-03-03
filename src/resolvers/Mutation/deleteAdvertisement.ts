import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Advertisement, User, Organization } from "../../models";
import {
  ADVERTISEMENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";

export const deleteAdvertisement: MutationResolvers["deleteAdvertisement"] =
  async (_parent, args, context) => {
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

    if (
      !(
        currentUser?.userType === "ADMIN" ||
        currentUser?.userType === "SUPERADMIN"
      )
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    const existingAdvertisement = await Advertisement.findOne({
      _id: args.id,
    }).lean();

    if (!existingAdvertisement) {
      throw new errors.NotFoundError(
        requestContext.translate(ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE),
        ADVERTISEMENT_NOT_FOUND_ERROR.CODE,
        ADVERTISEMENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    const organization = await Organization.findOne({
      _id: existingAdvertisement.organizationId,
    }).lean();

    if (
      currentUser?.userType !== "SUPERADMIN" &&
      !organization?.admins.find((admin: { _id: string }) => {
        admin._id === context.userId;
      })
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    const advertisement = {
      ...existingAdvertisement,
      mediaUrl: `${context.apiRootUrl}${existingAdvertisement.mediaUrl}`,
      _id: existingAdvertisement._id.toString(),
    };
    // Deletes the ad.
    await Advertisement.deleteOne({
      _id: args.id,
    });
    // Returns deleted ad.
    return { advertisement };
  };
