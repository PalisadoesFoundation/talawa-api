import CommentCache from "../redisCache";
import type { InterfaceComment } from "../../models";
import { Types } from "mongoose";
import { logger } from "../../libraries";

export async function findCommentsByPostIdInCache(
  postID: Types.ObjectId,
): Promise<(InterfaceComment | null)[]> {
  if (!postID) {
    return [null];
  }

  // fetches the comment id for a particular post
  const hashKey = `post_comments:${postID}`;

  const commentIDs = await CommentCache.hkeys(hashKey);

  if (commentIDs.length == 0) {
    return [];
  }

  // fetches the comment json data in the cache.

  const commentsFoundInCache = await CommentCache.mget(commentIDs);

  const comments = commentsFoundInCache.map((comment: string | null) => {
    if (comment === null) {
      return null;
    }

    try {
      const commentObj = JSON.parse(comment);

      // Note: While JSON parsing successfully restores the fields, including those with
      // Mongoose Object IDs, these fields are returned as strings due to the serialization
      // process. To ensure accurate data representation, we manually convert these string
      // values back to their original Mongoose Object ID types before delivering them to
      // the requesting resolver.

      return {
        ...commentObj,

        _id: Types.ObjectId.createFromHexString(commentObj._id.toString()),

        createdAt: new Date(commentObj.createdAt),

        creatorId: Types.ObjectId.createFromHexString(
          commentObj.creatorId.toString(),
        ),

        updatedAt: new Date(commentObj.updatedAt),

        postId: Types.ObjectId.createFromHexString(
          commentObj.postId.toString(),
        ),

        likedBy:
          commentObj?.likedBy.length !== 0
            ? commentObj?.likedBy?.map((user: string) => {
                return Types.ObjectId.createFromHexString(user.toString());
              })
            : [],
      };
    } catch (parseError) {
      logger.info(`Error parsing JSON:${parseError}`);
    }
  });

  return comments;
}
