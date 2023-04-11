import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { InterfaceOrganization } from "./Organization";
import { InterfaceUser } from "./User";
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
  admins: Array<PopulatedDoc<InterfaceUser & Document>>;
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

const GroupModel = () => model<InterfaceGroup>("Group", groupSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Group = (models.Group || GroupModel()) as ReturnType<
  typeof GroupModel
>;
