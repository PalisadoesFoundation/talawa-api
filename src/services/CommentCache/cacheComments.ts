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
        pipeline.set(key, JSON.stringify(comment));
        // SET the time to live for each of the organization in the cache to 300s.
        pipeline.expire(key, 300);
      }
    });

    // Execute the pipeline
    await pipeline.exec();
  } catch (error) {
    console.log(error);
  }
}
