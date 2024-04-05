import PostCache from "../redisCache";
import type { InterfacePost } from "../../models";
import mongoose from "mongoose";
import { logger } from "../../libraries";

export async function findPostsInCache(
  ids: string[],
): Promise<(InterfacePost | null)[]> {
  if (ids.length === 0) {
    return [null];
  }

  const keys: string[] = ids.map((id) => {
    return `post:${id}`;
  });

  const postsFoundInCache = await PostCache.mget(keys);

  const posts = postsFoundInCache.map((post) => {
    if (post === null) {
      return null;
    }

    try {
      const postObj = JSON.parse(post);

      // Note: While JSON parsing successfully restores the fields, including those with
      // Mongoose Object IDs, these fields are returned as strings due to the serialization
      // process. To ensure accurate data representation, we manually convert these string
      // values back to their original Mongoose Object ID types before delivering them to
      // the requesting resolver.

      return {
        ...postObj,

        _id: new mongoose.Types.ObjectId(postObj._id),

        createdAt: new Date(postObj.createdAt),

        organization: new mongoose.Types.ObjectId(postObj.organization),

        likeCount: Number(postObj.likeCount),

        commentCount: Number(postObj.commentCount),

        likedBy:
          postObj?.likedBy.length !== 0
            ? postObj?.likedBy?.map((user: string) => {
                return new mongoose.Types.ObjectId(user);
              })
            : [],

        creatorId: new mongoose.Types.ObjectId(postObj.creatorId),

        updatedAt: new Date(postObj.updatedAt),
      };
    } catch (parseError) {
      logger.info(`Error parsing JSON:${parseError}`);
    }
  });

  return posts;
}
