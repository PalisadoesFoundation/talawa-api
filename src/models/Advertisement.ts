import type { Model } from "mongoose";
import { Schema, model, models } from "mongoose";
/**
 * This is an interface that represents a database(MongoDB) document for Advertisement.
 */
type AdvertisementTypes = "POPUP" | "MENU" | "BANNER";
export interface InterfaceAdvertisement {
  _id: string;
  organizationId: string;
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
 * @param  organizationId - Organization ID associated with the advertisement (type: Schema.Types.ObjectId)
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
  organizationId: {
    type: String,
    required: true,
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
