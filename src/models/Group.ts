import type { PopulatedDoc, Types, Document } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
/**
 * This is an interface representing a document for a group in the database(MongoDB).
 */
export interface InterfaceGroup {
  _id: Types.ObjectId;
  title: string;
  description: string | undefined;
  createdAt: Date;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  status: string;
  admins: PopulatedDoc<InterfaceUser & Document>[];
}
/**
 * This is the structure of a group
 * @param title - Title
 * @param description - Description
 * @param createdAt - Created at Date
 * @param status - Status
 * @param admins - Admins
 */
const groupSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
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
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
});

const groupModel = () => model<InterfaceGroup>("Group", groupSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Group = (models.Group || groupModel()) as ReturnType<
  typeof groupModel
>;
