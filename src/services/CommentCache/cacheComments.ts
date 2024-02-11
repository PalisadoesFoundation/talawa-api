import { logger } from "../../libraries";
import type { InterfaceComment } from "../../models";
import CommentCache from "../redisCache";

// Function to store comments in the cache using pipelining
export async function cacheComments(
  comments: InterfaceComment[]
): Promise<void> {
  try {
    const pipeline = CommentCache.pipeline();

    comments.forEach((comment) => {
      if (comment !== null) {
        const key = `comment:${comment._id}`;
        const postID = `post_comments:${comment.postId}`;
        // Set the comment in the cache
        pipeline.set(key, JSON.stringify(comment));
        // Index comment on its postId
        pipeline.hset(postID, key, "null");
        // SET the time to live for each of the organization in the cache to 300s.
        pipeline.expire(key, 300);
        pipeline.expire(postID, 300);
      }
    });

    // Execute the pipeline
    await pipeline.exec();
  } catch (error) {
    logger.info(error);
  }
}
