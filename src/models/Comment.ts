import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfacePost } from "./Post";
/**
 * This is an interface representing a document for a comment in the database(MongoDB).
 */
export interface InterfaceComment {
  _id: Types.ObjectId;
  text: string;
  createdAt: Date;
  createdBy: PopulatedDoc<InterfaceUser & Document>;
  updatedAt: Date;
  updatedBy: PopulatedDoc<InterfaceUser & Document>;
  postId: PopulatedDoc<InterfacePost & Document>;
  likedBy: PopulatedDoc<InterfaceUser & Document>[];
  likeCount: number;
  status: string;
}
/**
 * This is the Structure of the Comments
 * @param text - Text
 * @param createdAt - Date when the comment was created
 * @param createdBy - Comment Creator, refer to `User` model
 * @param postId - Id of the post on which this comment is created
 * @param likedBy - Liked by whom
 * @param likeCount - No of likes
 * @param status - whether the comment is active, blocked or deleted.
 * @param updatedAt - Date when the comment was updated
 * @param updatedBy - Comment updator, refer to `User` model
 */
const commentSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
  }
);

commentSchema.pre<InterfaceComment>("save", function (next) {
  if (!this.updatedBy) {
    this.updatedBy = this.createdBy;
  }
  next();
});

const commentModel = (): Model<InterfaceComment> =>
  model<InterfaceComment>("Comment", commentSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Comment = (models.Comment || commentModel()) as ReturnType<
  typeof commentModel
>;
