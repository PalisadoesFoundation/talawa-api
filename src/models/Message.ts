import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Group } from "./Group";
import { Interface_User } from "./User";
/**
 * This is an interface that represents a database(MongoDB) document for Message.
 */
export interface Interface_Message {
  _id: Types.ObjectId;
  text: string;
  imageUrl: string | undefined;
  videoUrl: string | undefined;
  createdAt: Date;
  creator: PopulatedDoc<Interface_User & Document>;
  group: PopulatedDoc<Interface_Group & Document>;
  status: string;
}
/**
 * This describes the schema for a `Message` that corresponds to `Interface_Message` document.
 * @param text - Message content.
 * @param imageUrl - Image URL attached in the message.
 * @param videoUrl - Video URL attached in the message.
 * @param createdAt - Time stamp of data creation.
 * @param creator - Message Sender(User), referring to `User` model.
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

const MessageModel = () => model<Interface_Message>("Message", messageSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Message = (models.Message || MessageModel()) as ReturnType<
  typeof MessageModel
>;
