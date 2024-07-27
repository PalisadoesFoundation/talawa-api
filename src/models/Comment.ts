import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfacePost } from "./Post";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Represents a document for a comment in the MongoDB database.
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
 * Mongoose schema definition for a comment document.
 * @param text - Text content of the comment.
 * @param createdAt - Date when the comment was created.
 * @param creatorId - Reference to the user who created the comment.
 * @param updatedAt - Date when the comment was last updated.
 * @param postId - Reference to the post on which this comment is created.
 * @param likedBy - Array of users who liked the comment.
 * @param likeCount - Number of likes for the comment.
 * @param status - Status of the comment (ACTIVE, BLOCKED, DELETED).
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
    timestamps: true, // Adds createdAt and updatedAt automatically
  },
);

// Apply logging middleware to the schema
createLoggingMiddleware(commentSchema, "Comment");

/**
 * Returns the Mongoose Model for Comment to prevent OverwriteModelError.
 */
const commentModel = (): Model<InterfaceComment> =>
  model<InterfaceComment>("Comment", commentSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Comment = (models.Comment || commentModel()) as ReturnType<
  typeof commentModel
>;
