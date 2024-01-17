import type { Types, PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceGroupChatMessage } from "./GroupChatMessage";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
/**
 * This is an interface representing a document for a group chat in the database(MongoDB).
 */
export interface InterfaceGroupChat {
  _id: Types.ObjectId;
  title: string;
  users: PopulatedDoc<InterfaceUser & Document>[];
  messages: PopulatedDoc<InterfaceGroupChatMessage & Document>[];
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  createdAt: Date;
  updatedAt: Date;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  status: string;
}
/**
 * This is the structure of a group chat
 * @param title - Title
 * @param users - Users of the chat
 * @param messages - Message of the chat
 * @param creatorId - Creator of the chat
 * @param createdAt - Timestamp of creation
 * @param updatedAt - Timestamp of updation
 * @param organization - Organization
 * @param status - Status
 */
const groupChatSchema = new Schema(
  {
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
    creatorId: {
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
  },
  {
    timestamps: true,
  }
);

const groupChatModel = (): Model<InterfaceGroupChat> =>
  model<InterfaceGroupChat>("GroupChat", groupChatSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const GroupChat = (models.GroupChat || groupChatModel()) as ReturnType<
  typeof groupChatModel
>;
