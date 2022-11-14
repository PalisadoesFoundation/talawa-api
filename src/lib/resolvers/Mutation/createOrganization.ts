import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { User, Organization } from "../../models";
import { uploadImage } from "../../utilities";
import { errors, requestContext } from "../../libraries";
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
/**
 * This function enables to create an organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * @returns Created organization
 */
export const createOrganization: MutationResolvers["createOrganization"] =
  async (_parent, args, context) => {
    const currentUserExists = await User.exists({
      _id: context.userId,
    });

    // Checks whether currentUser with _id === context.userId exists.
    if (currentUserExists === false) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? USER_NOT_FOUND
          : requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    //Upload file
    let uploadImageObj;
    if (args.file) {
      uploadImageObj = await uploadImage(args.file, null);
    }

    // Creates new organization.
    const createdOrganization = await Organization.create({
      ...args.data,
      image: uploadImageObj
        ? uploadImageObj.imageAlreadyInDbPath
          ? uploadImageObj.imageAlreadyInDbPath
          : uploadImageObj.newImagePath
        : null,
      creator: context.userId,
      admins: [context.userId],
      members: [context.userId],
    });

    /*
    Adds createdOrganization._id to joinedOrganizations, createdOrganizations
    and adminFor lists on currentUser's document with _id === context.userId
    */
    await User.updateOne(
      {
        _id: context.userId,
      },
      {
        $push: {
          joinedOrganizations: createdOrganization._id,
          createdOrganizations: createdOrganization._id,
          adminFor: createdOrganization._id,
        },
      }
    );

    // Returns createdOrganization.
    return createdOrganization.toObject();
  };
