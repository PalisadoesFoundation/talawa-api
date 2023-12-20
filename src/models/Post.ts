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
  commentCount: number;
  createdAt: Date;
  createdBy: PopulatedDoc<InterfaceUser & Document>;
  imageUrl: string | undefined | null;
  likeCount: number;
  likedBy: PopulatedDoc<InterfaceUser & Document>[];
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  pinned: boolean;
  status: string;
  text: string;
  title: string | undefined;
  updatedAt: Date;
  updatedBy: PopulatedDoc<InterfaceUser & Document>;
  videoUrl: string | undefined | null;
}
/**
 * This describes the schema for a `Post` that corresponds to `InterfacePost` document.
 * @param commentCount - Post comments count.
 * @param createdAt - Time stamp of data creation.
 * @param createdBy - Post creator, refer to `User` model.
 * @param imageUrl - Post attached image URL(if attached).
 * @param likeCount - Post likes count.
 * @param likedBy - Collection of user liked the post, each object refer to `User` model.
 * @param pinned - Post pinned status
 * @param organization - Organization data where the post is uploaded, refer to `Organization` model.
 * @param status - Status.
 * @param text - Post description.
 * @param title - Post title.
 * @param updatedAt - Time stamp of post updation
 * @param updatedBy - Post creator, refer to `User` model.
 * @param videoUrl - Post attached video URL(if attached).
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
    imageUrl: {
      type: String,
      required: false,
    },
    videoUrl: {
      type: String,
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
  }
);

postSchema.plugin(mongoosePaginate);

postSchema.pre<InterfacePost>("save", function (next) {
  if (!this.updatedBy) {
    this.updatedBy = this.createdBy;
  }
  next();
});

postSchema.index({ organization: 1 }, { unique: false });

const postModel = (): PaginateModel<InterfacePost> =>
  model<InterfacePost, PaginateModel<InterfacePost>>("Post", postSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Post = (models.Post || postModel()) as ReturnType<
  typeof postModel
>;
