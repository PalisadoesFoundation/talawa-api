import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";
import { User, Organization, Post } from "../../models";
import {
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  POST_NOT_FOUND,
  POST_NOT_FOUND_MESSAGE,
  POST_NOT_FOUND_CODE,
  POST_NOT_FOUND_PARAM,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
/**
 * This function enables an admin to remove a post.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the post exists
 * 2. If the organization exists
 * 3. If the user exists
 * 4. If the user is an admin of organization
 * @returns Deleted post
 */
export const adminRemovePost: MutationResolvers["adminRemovePost"] = async (
  _parent,
  args,
  context
) => {
  const organization = await Organization.findOne({
    _id: args.organizationId,
  }).lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

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

  // Checks whether currentUser with _id === context.userId is an admin of organization.
  adminCheck(context.userId, organization);

  const post = await Post.findOne({
    _id: args.postId,
  }).lean();

  // Checks whether post exists.
  if (!post) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? POST_NOT_FOUND
        : requestContext.translate(POST_NOT_FOUND_MESSAGE),
      POST_NOT_FOUND_CODE,
      POST_NOT_FOUND_PARAM
    );
  }

  // Removes post._id from posts list on organization document.
  await Organization.updateOne(
    {
      _id: organization._id,
    },
    {
      $set: {
        posts: organization.posts.filter(
          (organizationPost) =>
            organizationPost.toString() !== post?._id.toString()
        ),
      },
    }
  );

  // //remove post from user
  // user.overwrite({
  //   ...user._doc,
  //   posts: user._doc.posts.filter((post) => post != args.postId),
  // });
  // await user.save();

  // Deletes the post.
  await Post.deleteOne({
    _id: args.postId,
  });

  // Returns the deleted post.
  return post;
};
