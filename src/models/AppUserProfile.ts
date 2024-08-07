import type { PaginateModel, PopulatedDoc, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { InterfaceEvent } from "./Event";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
import type { InterfaceFundraisingCampaign } from "./FundraisingCampaign";
import type { InterfaceFundraisingCampaignPledges } from "./FundraisingCampaignPledge";

export interface InterfaceAppUserProfile {
  _id: Types.ObjectId;
  userId: PopulatedDoc<InterfaceUser & Document>;
  adminFor: PopulatedDoc<InterfaceOrganization & Document>[];
  appLanguageCode: string;
  createdEvents: PopulatedDoc<InterfaceEvent & Document>[];
  createdOrganizations: PopulatedDoc<InterfaceOrganization & Document>[];
  eventAdmin: PopulatedDoc<InterfaceEvent & Document>[];
  pledges: PopulatedDoc<InterfaceFundraisingCampaignPledges & Document>[];
  campaigns: PopulatedDoc<InterfaceFundraisingCampaign & Document>[];
  pluginCreationAllowed: boolean;
  token: string | undefined;
  tokenVersion: number;
  isSuperAdmin: boolean;
}
/**
 * Mongoose schema for an application user profile.
 * @param userId - Reference to the user associated with the profile.
 * @param adminFor - Array of organizations where the user is an admin.
 * @param appLanguageCode - Language code preference of the app user.
 * @param createdEvents - Array of events created by the user.
 * @param createdOrganizations - Array of organizations created by the user.
 * @param eventAdmin - Array of events where the user is an admin.
 * @param pledges - Array of pledges associated with the user.
 * @param campaigns - Array of campaigns associated with the user.
 * @param pluginCreationAllowed - Flag indicating if user is allowed to create plugins.
 * @param tokenVersion - Token version for authentication.
 * @param isSuperAdmin - Flag indicating if the user is a super admin.
 * @param token - Access token associated with the user profile.
 */

const appUserSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminFor: [
      {
        type: Schema.Types.ObjectId,
        ref: "Organization",
      },
    ],
    appLanguageCode: {
      type: String,
      required: true,
      default: "en",
    },
    createdOrganizations: [
      {
        type: Schema.Types.ObjectId,
        ref: "Organization",
      },
    ],
    createdEvents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    eventAdmin: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    pledges: [
      {
        type: Schema.Types.ObjectId,
        ref: "FundraisingCampaignPledge",
      },
    ],
    campaigns: [
      {
        type: Schema.Types.ObjectId,
        ref: "FundraisingCampaign",
      },
    ],
    pluginCreationAllowed: {
      type: Boolean,
      required: true,
      default: true,
    },
    tokenVersion: {
      type: Number,
      required: true,
      default: 0,
    },
    token: {
      type: String,
      required: false,
    },
    isSuperAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
appUserSchema.plugin(mongoosePaginate);
const appUserProfileModel = (): PaginateModel<InterfaceAppUserProfile> =>
  model<InterfaceAppUserProfile, PaginateModel<InterfaceAppUserProfile>>(
    "AppUserProfile",
    appUserSchema,
  );

export const AppUserProfile = (models.AppUserProfile ||
  appUserProfileModel()) as ReturnType<typeof appUserProfileModel>;
