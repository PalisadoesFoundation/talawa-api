import {
  Schema,
  model,
  PopulatedDoc,
  Types,
  Document,
  PaginateModel,
  models,
} from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { Interface_Comment } from "./Comment";
import { Interface_Organization } from "./Organization";
import { Interface_User } from "./User";
/**
 * This is an interface that represents a database(MongoDB) document for Post.
 */
export interface Interface_Post {
  _id: Types.ObjectId;
  text: string;
  title: string | undefined;
  status: string;
  createdAt: Date;
  imageUrl: string | undefined | null;
  videoUrl: string | undefined;
  creator: PopulatedDoc<Interface_User & Document>;
  organization: PopulatedDoc<Interface_Organization & Document>;
  likedBy: Array<PopulatedDoc<Interface_User & Document>>;
  comments: Array<PopulatedDoc<Interface_Comment & Document>>;
  likeCount: number;
  commentCount: number;
  pinned: boolean;
}
/**
 * This describes the schema for a `Post` that corresponds to `Interface_Post` document.
 * @param text - Post description.
 * @param title - Post title.
 * @param status - Status.
 * @param createdAt - Time stamp of data creation.
 * @param imageUrl - Post attached image URL(if attached).
 * @param videoUrl - Post attached video URL(if attached).
 * @param creator - Post creator, refer to `User` model.
 * @param organization - Organization data where the post is uploaded, refer to `Organization` model.
 * @param likedBy - Collection of user liked the post, each object refer to `User` model.
 * @param comments - Collection of user commented on the post, each object refer to `Comment` model.
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
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Comment",
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

const PostModel = () =>
  model<Interface_Post, PaginateModel<Interface_Post>>("Post", postSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Post = (models.Post || PostModel()) as ReturnType<
  typeof PostModel
>;
