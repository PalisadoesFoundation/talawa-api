import { QueryResolvers } from '../../../generated/graphQLTypescriptTypes';
import { Comment } from '../../models';

export const comments: QueryResolvers['comments'] = async () => {
  return await Comment.find()
    .populate('creator', '-password')
    .populate('post')
    .populate('likedBy')
    .lean();
};
