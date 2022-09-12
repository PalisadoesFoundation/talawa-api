import {
  InputMaybe,
  PostOrderByInput,
  QueryResolvers,
} from '../../../generated/graphQLTypescriptTypes';
import { Post } from '../../models';

export const postsByOrganization: QueryResolvers['postsByOrganization'] =
  async (_parent, args) => {
    const sort = getSort(args.orderBy);

    return Post.find({
      organization: args.id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();
  };

const getSort = (orderBy: InputMaybe<PostOrderByInput> | undefined) => {
  if (orderBy !== null) {
    if (orderBy === 'id_ASC') {
      return {
        _id: 1,
      };
    } else if (orderBy === 'id_DESC') {
      return {
        _id: -1,
      };
    } else if (orderBy === 'text_ASC') {
      return {
        text: 1,
      };
    } else if (orderBy === 'text_DESC') {
      return {
        text: -1,
      };
    } else if (orderBy === 'title_ASC') {
      return {
        title: 1,
      };
    } else if (orderBy === 'title_DESC') {
      return {
        title: -1,
      };
    } else if (orderBy === 'createdAt_ASC') {
      return {
        createdAt: 1,
      };
    } else if (orderBy === 'createdAt_DESC') {
      return {
        createdAt: -1,
      };
    } else if (orderBy === 'imageUrl_ASC') {
      return {
        imageUrl: 1,
      };
    } else if (orderBy === 'imageUrl_DESC') {
      return {
        imageUrl: -1,
      };
    } else if (orderBy === 'videoUrl_ASC') {
      return {
        videoUrl: 1,
      };
    } else if (orderBy === 'videoUrl_DESC') {
      return {
        videoUrl: -1,
      };
    } else if (orderBy === 'likeCount_ASC') {
      return {
        likeCount: 1,
      };
    } else if (orderBy === 'likeCount_DESC') {
      return {
        likeCount: -1,
      };
    } else if (orderBy === 'commentCount_ASC') {
      return {
        commentCount: 1,
      };
    } else {
      return {
        commentCount: -1,
      };
    }
  }

  return {};
};
