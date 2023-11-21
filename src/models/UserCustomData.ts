import type { Model} from "mongoose";
import mongoose, { Types, model } from "mongoose";

/**
 * This is an interface representing a document for custom field in the database(MongoDB).
 */
export interface InterfaceUserCustomData {
  _id: string;
  organizationId: string;
  values: any;
  userId: string;
}

/**
 * This is the structure of the User Custom Data
 * @param organizationId - The id of the organization to which the user belongs.
 * @param userId - The id of the user
 * @param values - The values of the demographic detail
 */

const userCustomDataSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.String,
    ref: "Organization",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.String,
    ref: "User",
    required: true,
  },
  values: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {},
  },
});

const UserCustomData: Model<InterfaceUserCustomData> =
  model<InterfaceUserCustomData>("CustomData", userCustomDataSchema);

export default UserCustomData;
