import type { PopulatedDoc, Types, Document, PaginateModel } from "mongoose";
import { Schema, model, models } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
/**
 * This is an interface that represents a database(MongoDB) document for Post.
 */
export interface InterfacePost {
  _id: Types.ObjectId;
  text: string;
  title: string | undefined;
  status: string;
  createdAt: Date;
  imageUrl: string | undefined | null;
  videoUrl: string | undefined;
  creator: PopulatedDoc<InterfaceUser & Document>;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  likedBy: PopulatedDoc<InterfaceUser & Document>[];
  likeCount: number;
  commentCount: number;
  pinned: boolean;
}
/**
 * This describes the schema for a `Post` that corresponds to `InterfacePost` document.
 * @param text - Post description.
 * @param title - Post title.
 * @param status - Status.
 * @param createdAt - Time stamp of data creation.
 * @param imageUrl - Post attached image URL(if attached).
 * @param videoUrl - Post attached video URL(if attached).
 * @param creator - Post creator, refer to `User` model.
 * @param organization - Organization data where the post is uploaded, refer to `Organization` model.
 * @param likedBy - Collection of user liked the post, each object refer to `User` model.
 * @param likeCount - Post likes count.
 * @param commentCount - Post comments count.
 */
const postSchema = new Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  videoUrl: {
    type: String,
    required: false,
  },
  creator: {
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
});

postSchema.plugin(mongoosePaginate);
postSchema.index({ organization: 1 }, { unique: false });

const postModel = (): PaginateModel<InterfacePost> =>
  model<InterfacePost, PaginateModel<InterfacePost>>("Post", postSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Post = (models.Post || postModel()) as ReturnType<
  typeof postModel
>;
