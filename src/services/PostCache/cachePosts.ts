import { logger } from "../../libraries";
import type { InterfacePost } from "../../models";
import PostCache from "../redisCache";

// Function to store posts in the cache using pipelining
export async function cachePosts(posts: InterfacePost[]): Promise<void> {
  try {
    const pipeline = PostCache.pipeline();

    posts.forEach((post) => {
      if (post !== null) {
        const key = `post:${post._id}`;
        pipeline.set(key, JSON.stringify(post));
        // SET the time to live for each of the organization in the cache to 300s.
        pipeline.expire(key, 300);
      }
    });

    // Execute the pipeline
    await pipeline.exec();
  } catch (error) {
    logger.info(error);
  }
}
