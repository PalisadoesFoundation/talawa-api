import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";

/**
 * Interface representing a MongoDB document for User Family.
 */
export interface InterfaceUserFamily {
  _id: Types.ObjectId;
  title: string;
  users: PopulatedDoc<InterfaceUser & Document>[];
  admins: PopulatedDoc<InterfaceUser & Document>[];
  creator: PopulatedDoc<InterfaceUser & Document>[];
}

/**
 * Mongoose schema definition for User Family documents.
 * @param title - Name of the user Family.
 * @param users - Members associated with the user Family.
 * @param admins - Admins of the user Family.
 * @param creator - Creator of the user Family.
 */
const userFamilySchema = new Schema({
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
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

// Create and export the UserFamily model
const userFamilyModel = (): Model<InterfaceUserFamily> =>
  model<InterfaceUserFamily>("UserFamily", userFamilySchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const UserFamily = (models.UserFamily ||
  userFamilyModel()) as ReturnType<typeof userFamilyModel>;
