import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceGroup } from "./Group";
import type { InterfaceUser } from "./User";
/**
 * This is an interface that represents a database(MongoDB) document for Message.
 */
export interface InterfaceMessage {
  _id: Types.ObjectId;
  text: string;
  imageUrl: string | undefined;
  videoUrl: string | undefined;
  createdAt: Date;
  updatedAt: Date;
  createdBy: PopulatedDoc<InterfaceUser & Document>;
  updatedBy: PopulatedDoc<InterfaceUser & Document>;
  group: PopulatedDoc<InterfaceGroup & Document>;
  status: string;
}
/**
 * This describes the schema for a `Message` that corresponds to `InterfaceMessage` document.
 * @param text - Message content.
 * @param imageUrl - Image URL attached in the message.
 * @param videoUrl - Video URL attached in the message.
 * @param createdAt - Timestamp of data creation.
 * @param createdBy - Message Sender(User), referring to `User` model.
 * @param updatedAt - Timestamp of data updation
 * @param updatedBy - Message Sender(User), referring to `User` model.
 * @param group - group data, referring to `Group` model.
 * @param status - Status.
 */
const messageSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  videoUrl: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["ACTIVE", "BLOCKED", "DELETED"],
    default: "ACTIVE",
  },
});

messageSchema.pre<InterfaceMessage>("save", function (next) {
  if (!this.updatedBy) {
    this.updatedBy = this.createdBy;
  }
  next();
});

const messageModel = (): Model<InterfaceMessage> =>
  model<InterfaceMessage>("Message", messageSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Message = (models.Message || messageModel()) as ReturnType<
  typeof messageModel
>;
