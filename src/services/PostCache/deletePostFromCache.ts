import PostCache from "../redisCache";
import type { InterfacePost } from "../../models";

export async function deletePostFromCache(post: InterfacePost): Promise<void> {
  const key = `post:${post._id}`;

  await PostCache.del(key);

  console.log("Post deleted from cache");
}
