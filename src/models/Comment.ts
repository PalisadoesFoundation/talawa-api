import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfacePost } from "./Post";
import { createLoggingMiddleware } from "../libraries/dbLogger";
/**
 * This is an interface representing a document for a comment in the database - (MongoDB).
 */
export interface InterfaceComment {
  _id: Types.ObjectId;
  text: string;
  createdAt: Date;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  updatedAt: Date;
  postId: PopulatedDoc<InterfacePost & Document>;
  likedBy: PopulatedDoc<InterfaceUser & Document>[];
  likeCount: number;
  status: string;
}
/**
 * This is the Structure of the Comments
 * @param text - Text
 * @param createdAt - Date when the comment was created
 * @param creatorId - Comment Creator, refer to `User` model
 * @param postId - Id of the post on which this comment is created
 * @param likedBy - Liked by whom
 * @param likeCount - No of likes
 * @param status - whether the comment is active, blocked or deleted.
 * @param updatedAt - Date when the comment was updated
 */
const commentSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    creatorId: {
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
  },
  {
    timestamps: true,
  },
);

createLoggingMiddleware(commentSchema, "Comment");

const commentModel = (): Model<InterfaceComment> =>
  model<InterfaceComment>("Comment", commentSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Comment = (models.Comment || commentModel()) as ReturnType<
  typeof commentModel
>;
