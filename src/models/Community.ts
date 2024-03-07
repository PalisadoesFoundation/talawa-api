import { Schema, model, models } from "mongoose";
import type { Types, Model } from "mongoose";

/**
 * This is an interface that represents a database(MongoDB) document for Community.
 */
export interface InterfaceCommunity {
  _id: Types.ObjectId;
  name: string;
  logoUrl: string | undefined;
  description: string;
  websiteLink: string | undefined;
  socialMediaUrls: {
    facebook: string | undefined;
    instagram: string | undefined;
    twitter: string | undefined;
    linkedIn: string | undefined;
    gitHub: string | undefined;
    youTube: string | undefined;
    slack: string | undefined;
    reddit: string | undefined;
  };
  timeout: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * This describes the schema for a `Community` that corresponds to `InterfaceCommunity` document.
 * @param logoUrl - Community logo URL.
 * @param description - Community description.
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
 * @param timeout - Timeout duration in minutes (default is 30 minutes).
 * @param createdAt - Time stamp of data creation.
 * @param updatedAt - Time stamp of updatation
 */

const communitySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    logoUrl: {
      type: String,
    },
    description: {
      type: String,
      required: true,
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
    timeout: {
      type: Number,
      default: 30,
      min: [15, "Timeout should be at least 15 minutes."],
      max: [60, "Timeout should not exceed 60 minutes."],
    },
  },
  {
    timestamps: true,
  },
);

const communityModel = (): Model<InterfaceCommunity> =>
  model<InterfaceCommunity>("Community", communitySchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Community = (models.Community || communityModel()) as ReturnType<
  typeof communityModel
>;
