import { Schema, model, models } from "mongoose";
import type { Types, Model } from "mongoose";

/**
 * This is an interface that represents a database(MongoDB) document for Community.
 */
export interface InterfaceCommunity {
  _id: Types.ObjectId;
  name: string;
  logoUrl: string;
  websiteLink: string;
  socialMediaUrls: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedIn: string;
    gitHub: string;
    youTube: string;
    slack: string;
    reddit: string;
  };
}

/**
 * This describes the schema for a `Community` that corresponds to `InterfaceCommunity` document.
 * @param logoUrl - Community logo URL.
 * @param socialMediaUrls - Social media URLs.
 * @param facebook - Facebook URL.
 * @param instagram - Instagram URL
 * @param twitter - Twitter URL.
 * @param linkedIn - LinkedIn URL.
 * @param gitHub - GitHub URL.
 * @param youTube - YouTube URL.
 * @param slack - Slack URL.
 * @param reddit - Reddit URL.
 * @param websiteLink - Community website URL.
 * @param name - Community name.
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
    twitter: {
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

const communityModel = (): Model<InterfaceCommunity> =>
  model<InterfaceCommunity>("Community", communitySchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Community = (models.Community || communityModel()) as ReturnType<
  typeof communityModel
>;
