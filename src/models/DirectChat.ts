import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { InterfaceDirectChatMessage } from "./DirectChatMessage";
import { InterfaceOrganization } from "./Organization";
import { InterfaceUser } from "./User";
/**
 * This is an interface representing a document for direct chat in the database(MongoDB).
 */
export interface InterfaceDirectChat {
  _id: Types.ObjectId;
  users: PopulatedDoc<InterfaceUser & Document>[];
  messages: PopulatedDoc<InterfaceDirectChatMessage & Document>[];
  creator: PopulatedDoc<InterfaceUser & Document>;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  status: string;
}
/**
 * This is the Structure of the direct chat.
 * @param users - Users of the chat
 * @param messages -  Messages
 * @param creator - Creator of the chat
 * @param organization - Organization
 * @param status - whether the chat is active, blocked or deleted.
 */
const directChatSchema = new Schema({
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "DirectChatMessage",
    },
  ],
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
  status: {
    type: String,
    required: true,
    enum: ["ACTIVE", "BLOCKED", "DELETED"],
    default: "ACTIVE",
  },
});

const directChatModel = () =>
  model<InterfaceDirectChat>("DirectChat", directChatSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const DirectChat = (models.DirectChat ||
  directChatModel()) as ReturnType<typeof directChatModel>;
