import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { InterfaceGroup } from "./Group";
import { InterfaceUser } from "./User";
/**
 * This is an interface that represents a database(MongoDB) document for Message.
 */
export interface InterfaceMessage {
  _id: Types.ObjectId;
  text: string;
  imageUrl: string | undefined;
  videoUrl: string | undefined;
  createdAt: Date;
  creator: PopulatedDoc<InterfaceUser & Document>;
  group: PopulatedDoc<InterfaceGroup & Document>;
  status: string;
}
/**
 * This describes the schema for a `Message` that corresponds to `InterfaceMessage` document.
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

const MessageModel = () => model<InterfaceMessage>("Message", messageSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Message = (models.Message || MessageModel()) as ReturnType<
  typeof MessageModel
>;
