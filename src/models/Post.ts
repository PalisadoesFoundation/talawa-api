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
import { MONGOOSE_POST_ERRORS } from "../constants";
import { Interface_Comment } from "./Comment";
import { Interface_Organization } from "./Organization";
import { Interface_User } from "./User";

export interface Interface_Post {
  _id: Types.ObjectId;
  text: string;
  title: string | undefined;
  status: string;
  createdAt: Date;
  imageUrl: string | undefined;
  videoUrl: string | undefined;
  creator: PopulatedDoc<Interface_User & Document>;
  organization: PopulatedDoc<Interface_Organization & Document>;
  likedBy: Array<PopulatedDoc<Interface_User & Document>>;
  comments: Array<PopulatedDoc<Interface_Comment & Document>>;
  likeCount: number;
  commentCount: number;
}

const postSchema = new Schema({
  text: {
    type: String,
    required: true,
    maxLength: [500, MONGOOSE_POST_ERRORS.TEXT_ERRORS.lengthError],
    match: [
      /^[a-zA-Z0-9!@#$%^&*()_\-+. ,]+$/,
      MONGOOSE_POST_ERRORS.TEXT_ERRORS.regexError,
    ],
  },
  title: {
    type: String,
    maxLength: [256, MONGOOSE_POST_ERRORS.TITLE_ERRORS.lengthError],
    match: [
      /^[a-zA-Z0-9!@#$%^&*()_\-+. ,]+$/,
      MONGOOSE_POST_ERRORS.TITLE_ERRORS.regexError,
    ],
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
});

postSchema.plugin(mongoosePaginate);

const PostModel = () =>
  model<Interface_Post, PaginateModel<Interface_Post>>("Post", postSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Post = (models.Post || PostModel()) as ReturnType<
  typeof PostModel
>;
