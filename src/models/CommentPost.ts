import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { InterfaceComment } from "./Comment";
import { InterfacePost } from "./Post";

export interface InterfaceCommentPost {
  _id: Types.ObjectId;
  postId: PopulatedDoc<InterfacePost & Document>;
  commentId: PopulatedDoc<InterfaceComment & Document>;
}

// Relational schema used to keep track of comments on each post
const CommentPostSchema = new Schema({
  postId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Post",
  },
  commentId: {
    type: Schema.Types.ObjectId,
    ref: "Comment",
    required: true,
  },
});

CommentPostSchema.index(
  {
    postId: 1,
    commentId: 1,
  },
  {
    unique: true,
  }
);

const CommentPostModel = () =>
  model<InterfaceCommentPost>("CommentPost", CommentPostSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const CommentPost = (models.CommentPost ||
  CommentPostModel()) as ReturnType<typeof CommentPostModel>;
