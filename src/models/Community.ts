import { Schema, model, models } from "mongoose";
import type { Types, Model } from "mongoose";

/**
 * Interface representing a document for a community in MongoDB.
 */
export interface InterfaceCommunity {
  _id: Types.ObjectId;
  name: string;
  logoUrl: string;
  websiteLink: string;
  socialMediaUrls: {
    facebook: string;
    instagram: string;
    X: string;
    linkedIn: string;
    gitHub: string;
    youTube: string;
    slack: string;
    reddit: string;
  }; // Object containing various social media URLs for the community.
}

/**
 * Mongoose schema for a community.
 * @param name - Name of the community.
 * @param logoUrl - URL of the community's logo.
 * @param websiteLink - URL of the community's website.
 * @param socialMediaUrls - Object containing social media URLs for the community.
 * @param facebook - Facebook URL.
 * @param instagram - Instagram URL.
 * @param X - X URL.
 * @param linkedIn - LinkedIn URL.
 * @param gitHub - GitHub URL.
 * @param youTube - YouTube URL.
 * @param slack - Slack URL.
 * @param reddit - Reddit URL.
 */
const communitySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  logoUrl: {
    type: String,
  },
  websiteLink: {
    type: String,
  },
  socialMediaUrls: {
    facebook: {
      type: String,
    },
    instagram: {
      type: String,
    },
    X: {
      type: String,
    },
    linkedIn: {
      type: String,
    },
    gitHub: {
      type: String,
    },
    youTube: {
      type: String,
    },
    slack: {
      type: String,
    },
    reddit: {
      type: String,
    },
  },
});

/**
 * Retrieves or creates the Mongoose model for Community.
 * Prevents Mongoose OverwriteModelError during testing.
 */
const communityModel = (): Model<InterfaceCommunity> =>
  model<InterfaceCommunity>("Community", communitySchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Community = (models.Community || communityModel()) as ReturnType<
  typeof communityModel
>;
