import { QueryResolvers } from '../../../generated/graphQLTypescriptTypes';
import { Post } from '../../models';
import { errors, requestContext } from '../../libraries';
import {
  IN_PRODUCTION,
  POST_NOT_FOUND,
  POST_NOT_FOUND_CODE,
  POST_NOT_FOUND_MESSAGE,
  POST_NOT_FOUND_PARAM,
} from '../../../constants';

export const post: QueryResolvers['post'] = async (_parent, args) => {
  const post = await Post.findOne({ _id: args.id })
    .populate('organization')
    .populate({
      path: 'comments',
      populate: {
        path: 'creator',
      },
    })
    .populate('likedBy')
    .populate('creator', '-password')
    .lean();

  if (!post) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? POST_NOT_FOUND
        : requestContext.translate(POST_NOT_FOUND_MESSAGE),
      POST_NOT_FOUND_CODE,
      POST_NOT_FOUND_PARAM
    );
  }

  post.likeCount = post.likedBy.length || 0;
  post.commentCount = post.comments.length || 0;

  return post;
};
