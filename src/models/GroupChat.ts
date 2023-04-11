import { Schema, Types, model, PopulatedDoc, Document, models } from "mongoose";
import { InterfaceGroupChatMessage } from "./GroupChatMessage";
import { InterfaceOrganization } from "./Organization";
import { InterfaceUser } from "./User";
/**
 * This is an interface representing a document for a group chat in the database(MongoDB).
 */
export interface InterfaceGroupChat {
  _id: Types.ObjectId;
  title: string;
  users: Array<PopulatedDoc<InterfaceUser & Document>>;
  messages: Array<PopulatedDoc<InterfaceGroupChatMessage & Document>>;
  creator: PopulatedDoc<InterfaceUser & Document>;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  status: string;
}
/**
 * This is the structure of a group chat
 * @param title - Title
 * @param users - Users of the chat
 * @param messages - Message of the chat
 * @param creator - Creator of the chat
 * @param organization - Organization
 * @param status - Status
 */
const groupChatSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
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
      ref: "GroupChatMessage",
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

const GroupChatModel = () =>
  model<InterfaceGroupChat>("GroupChat", groupChatSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const GroupChat = (models.GroupChat || GroupChatModel()) as ReturnType<
  typeof GroupChatModel
>;
