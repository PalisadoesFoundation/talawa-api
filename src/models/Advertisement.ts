import type { Types, Model, PopulatedDoc } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
/**
 * This is an interface that represents a database(MongoDB) document for Advertisement.
 */
type AdvertisementTypes = {
  type: "POPUP" | "MENU" | "BANNER";
  // Other properties specific to each type
};
export interface InterfaceAdvertisement {
  _id: Types.ObjectId;
  orgId: string;
  name: string;
  createdBy: PopulatedDoc<InterfaceUser & Document>;
  updatedBy: PopulatedDoc<InterfaceUser & Document>;
  link: string;
  type: AdvertisementTypes;
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @param  name - Name of the advertisement (type: String)
 * Description: Name of the advertisement.
 */

/**
 * @param  createdAt - Timestamp of Advertisement creation (type: Date)
 * Description: Timestamp of Advertisement creation.
 */

/**
 * @param  createdBy - Advertisement creator, ref to `User` model
 * Description: Advertisement creator.
 */

/**
 * @param  updatedAt - Timestamp of Advertisement updation (type: Date)
 * Description: Timestamp of Advertisement updation.
 */

/**
 * @param  updatedBy - Advertisement updator, ref to `User` model
 * Description: Advertisement updator.
 */

/**
 * @param  orgId - Organization ID associated with the advertisement (type: Schema.Types.ObjectId)
 * Description: Organization ID associated with the advertisement.
 */

/**
 * @param  link - Link associated with the advertisement (type: String)
 * Description: Link associated with the advertisement.
 */

/**
 * @param  type - Type of advertisement (POPUP, MENU, BANNER) (type: String)
 * Description: Type of advertisement (POPUP, MENU, BANNER).
 */

/**
 * @param  startDate - Start date of the advertisement (type: Date)
 * Description: Start date of the advertisement.
 */

/**
 * @param  endDate - End date of the advertisement (type: Date)
 * Description: End date of the advertisement.
 */
const advertisementSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    orgId: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    link: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["POPUP", "MENU", "BANNER"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

advertisementSchema.pre<InterfaceAdvertisement>("save", function (next) {
  if (!this.updatedBy) {
    this.updatedBy = this.createdBy;
  }
  next();
});

const advertisementModel = (): Model<InterfaceAdvertisement> =>
  model<InterfaceAdvertisement>("Advertisement", advertisementSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Advertisement = (models.Advertisement ||
  advertisementModel()) as ReturnType<typeof advertisementModel>;
