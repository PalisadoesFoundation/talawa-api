import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
/**
 * This is an interface that represents a database(MongoDB) document for Family.
 */

export interface InterfaceUserFamily {
  _id: Types.ObjectId;
  title: string;
  users: PopulatedDoc<InterfaceUser & Document>[];
  admins: PopulatedDoc<InterfaceUser & Document>[];
  creator: PopulatedDoc<InterfaceUser & Document>[];
}

/**
 * @param  title - Name of the user Family (type: String)
 * Description: Name of the user Family.
 */

/**
 * @param  users - Members associated with the user Family (type: String)
 * Description: Members associated with the user Family.
 */
const UserFamilySchema = new Schema({
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

const userFamilyModel = (): Model<InterfaceUserFamily> =>
  model<InterfaceUserFamily>("UserFamily", UserFamilySchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const UserFamily = (models.UserFamily ||
  userFamilyModel()) as ReturnType<typeof userFamilyModel>;
