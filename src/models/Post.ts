import type { PopulatedDoc, Types, Document, PaginateModel } from "mongoose";
import { Schema, model, models } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
import type { InterfaceFile } from "./File";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Represents a MongoDB document for Post in the database.
 */
export interface InterfacePost {
  _id: Types.ObjectId;
  commentCount: number;
  createdAt: Date;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  file: PopulatedDoc<InterfaceFile & Document> | null;
  likeCount: number;
  likedBy: PopulatedDoc<InterfaceUser & Document>[];
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  pinned: boolean;
  status: string;
  text: string;
  title: string | undefined;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for Post documents.
 * @param text - Content or description of the post.
 * @param title - Title of the post.
 * @param status - Status of the post.
 * @param imageUrl - URL of the attached image, if any.
 * @param videoUrl - URL of the attached video, if any.
 * @param creatorId - Reference to the user who created the post.
 * @param organization - Reference to the organization where the post is uploaded.
 * @param likedBy - Array of users who liked the post.
 * @param likeCount - Number of likes on the post.
 * @param commentCount - Number of comments on the post.
 * @param pinned - Indicates if the post is pinned.
 */
const postSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "BLOCKED", "DELETED"],
      default: "ACTIVE",
    },
    file: {
      type: Schema.Types.ObjectId,
      ref: "File",
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
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
    commentCount: {
      type: Number,
      default: 0,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Apply pagination plugin to the schema
postSchema.plugin(mongoosePaginate);

// Ensure indexing for organization field for efficient querying
postSchema.index({ organization: 1 }, { unique: false });

// Middleware to log database operations on the Post collection
createLoggingMiddleware(postSchema, "Post");

// Define and export the model directly
const postModel = (): PaginateModel<InterfacePost> =>
  model<InterfacePost, PaginateModel<InterfacePost>>("Post", postSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Post = (models.Post || postModel()) as ReturnType<
  typeof postModel
>;
