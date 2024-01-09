import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceDirectChatMessage } from "./DirectChatMessage";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
/**
 * This is an interface representing a document for direct chat in the database(MongoDB).
 */
export interface InterfaceDirectChat {
  _id: Types.ObjectId;
  users: PopulatedDoc<InterfaceUser & Document>[];
  messages: PopulatedDoc<InterfaceDirectChatMessage & Document>[];
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
/**
 * This is the Structure of the direct chat.
 * @param users - Users of the chat
 * @param messages -  Messages
 * @param creatorId - Creator of the chat, ref to `User` model
 * @param organization - Organization
 * @param status - whether the chat is active, blocked or deleted.
 * @param createdAt - Timestamp of chat creation
 * @param updatedAt - Timestamp of chat updation
 */
const directChatSchema = new Schema(
  {
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
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
  },
  {
    timestamps: true,
  }
);

const directChatModel = (): Model<InterfaceDirectChat> =>
  model<InterfaceDirectChat>("DirectChat", directChatSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const DirectChat = (models.DirectChat ||
  directChatModel()) as ReturnType<typeof directChatModel>;
