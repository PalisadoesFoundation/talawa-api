import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Post } from "./Post";
import { Interface_User } from "./User";
import dayjs from "dayjs";

export interface Interface_Comment {
  _id: Types.ObjectId;
  text: string;
  createdAt: Date;
  creator: PopulatedDoc<Interface_User & Document>;
  post: PopulatedDoc<Interface_Post & Document>;
  likedBy: Array<PopulatedDoc<Interface_User & Document>>;
  likeCount: number;
  status: string;
}

const commentSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: dayjs(Date.now()),
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  post: {
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

const CommentModel = () => model<Interface_Comment>("Comment", commentSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Comment = (models.Comment || CommentModel()) as ReturnType<
  typeof CommentModel
>;
