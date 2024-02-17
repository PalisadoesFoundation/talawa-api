import CommentCache from "../redisCache";
import type { InterfaceComment } from "../../models";

export async function deleteCommentFromCache(
  comment: InterfaceComment
): Promise<void> {
  const key = `comment:${comment._id}`;

  await CommentCache.del(key);
}
