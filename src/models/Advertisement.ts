import type { Types, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
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
  mediaUrl: string;
  type: AdvertisementTypes;
  startDate: string;
  endDate: string;
}

/**
 * @param  name - Name of the advertisement (type: String)
 * Description: Name of the advertisement.
 */

/**
 * @param  orgId - Organization ID associated with the advertisement (type: Schema.Types.ObjectId)
 * Description: Organization ID associated with the advertisement.
 */

/**
 * @param  mediaUrl - media associated with the advertisement (type: String)
 * Description: media associated with the advertisement.
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
const advertisementSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  orgId: {
    type: String,
  },
  mediaUrl: {
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
});

const advertisementModel = (): Model<InterfaceAdvertisement> =>
  model<InterfaceAdvertisement>("Advertisement", advertisementSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Advertisement = (models.Advertisement ||
  advertisementModel()) as ReturnType<typeof advertisementModel>;
