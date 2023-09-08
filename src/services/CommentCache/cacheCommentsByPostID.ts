import { Types } from "mongoose";
import type { InterfaceComment } from "../../models";
import CommentCache from "../redisCache";

// Function to store comments in the cache using pipelining
export async function cacheCommentsByPostID(
  comments: InterfaceComment[] , 
  postID: Types.ObjectId
): Promise<void> {
  try {
    const pipeline = CommentCache.pipeline();

    const key = `post_comments:${postID}`;

    comments.forEach((comment) => {
      const commentID = comment._id;
  
      // Use HSET to store null values as placeholders for comment IDs
      pipeline.hset(key, String(commentID), 'null');
      // Optional: Set TTL for the hash key
      pipeline.expire(key, 300); // Set TTL to 5 minutes (adjust as needed)
    });

    // Execute the pipeline
    await pipeline.exec();

    console.log("comments cached succesfully in cache");
    
  } catch (error) {
    console.log(error);
  }
}
