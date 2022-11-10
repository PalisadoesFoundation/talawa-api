import { Schema, Types, model, PopulatedDoc, Document, models } from "mongoose";
import { Interface_GroupChatMessage } from "./GroupChatMessage";
import { Interface_Organization } from "./Organization";
import { Interface_User } from "./User";
/**
 * This is an interface representing a document for a group chat in the database(MongoDB). 
 */
export interface Interface_GroupChat {
  _id: Types.ObjectId;
  title: string;
  users: Array<PopulatedDoc<Interface_User & Document>>;
  messages: Array<PopulatedDoc<Interface_GroupChatMessage & Document>>;
  creator: PopulatedDoc<Interface_User & Document>;
  organization: PopulatedDoc<Interface_Organization & Document>;
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
  model<Interface_GroupChat>("GroupChat", groupChatSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const GroupChat = (models.GroupChat || GroupChatModel()) as ReturnType<
  typeof GroupChatModel
>;
