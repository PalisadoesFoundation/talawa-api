import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Post, Organization } from "../../models";
import { uploadImage } from "../../utilities";
import { errors, requestContext } from "../../libraries";
import {
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";

export const createPost: MutationResolvers["createPost"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id == context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const organizationExists = await Organization.exists({
    _id: args.data.organizationId,
  });

  // Checks whether organization with _id == args.data.organizationId exists.
  if (organizationExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  let uploadImageObj;

  if (args.file) {
    uploadImageObj = await uploadImage(args.file, "");
  }

  // Creates new post.
  const createdPost = await Post.create({
    ...args.data,
    creator: context.userId,
    organization: args.data.organizationId,
    imageUrl: args.file ? uploadImageObj?.newImagePath : "",
  });

  // Returns createdPost.
  return createdPost.toObject();
};
