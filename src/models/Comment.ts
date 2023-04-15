import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { InterfaceUser } from "./User";
import { InterfacePost } from "./Post";
/**
 * This is an interface representing a document for a comment in the database(MongoDB).
 */
export interface InterfaceComment {
  _id: Types.ObjectId;
  text: string;
  createdAt: Date;
  postId: PopulatedDoc<InterfacePost & Document>;
  creator: PopulatedDoc<InterfaceUser & Document>;
  likedBy: Array<PopulatedDoc<InterfaceUser & Document>>;
  likeCount: number;
  status: string;
}
/**
 * This is the Structure of the Comments
 * @param text - Text
 * @param createdAt - Date when the comment was created
 * @param creator - Creator of the comment
 * @param postId - The post on which the comment is created
 * @param likedBy - Liked by whom
 * @param likeCount - No of likes
 * @param status - whether the comment is active, blocked or deleted.
 */
const commentSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  postId: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  likedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  likeCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ["ACTIVE", "BLOCKED", "DELETED"],
    default: "ACTIVE",
  },
});

const CommentModel = () => model<InterfaceComment>("Comment", commentSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Comment = (models.Comment || CommentModel()) as ReturnType<
  typeof CommentModel
>;
