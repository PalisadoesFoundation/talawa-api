import PostCache from "../redisCache";

/**
 * Deletes a post from Redis cache based on its postId.
 * @param postId - The unique identifier of the post to delete.
 * @returns Promise<void>
 */
export async function deletePostFromCache(postId: string): Promise<void> {
  // Construct the cache key for the specified postId
  const key = `post:${postId}`;

  // Delete the post from Redis cache
  await PostCache.del(key);
}
