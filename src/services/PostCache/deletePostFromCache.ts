import PostCache from "../redisCache";
import type { InterfacePost } from "../../models";
import { Types } from "mongoose";

export async function deletePostFromCache(postId: string): Promise<void> {
  const key = `post:${postId}`;

  await PostCache.del(key);

  console.log("Post deleted from cache");
}
