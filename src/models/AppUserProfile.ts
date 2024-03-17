import type { PaginateModel, PopulatedDoc, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { InterfaceEvent } from "./Event";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";

export interface InterfaceAppUserProfile {
  _id: Types.ObjectId;
  userId: PopulatedDoc<InterfaceUser & Document>;
  adminFor: PopulatedDoc<InterfaceOrganization & Document>[];
  adminApproved: boolean;
  appLanguageCode: string;
  createdEvents: PopulatedDoc<InterfaceEvent & Document>[];
  createdOrganizations: PopulatedDoc<InterfaceOrganization & Document>[];
  eventAdmin: PopulatedDoc<InterfaceEvent & Document>[];
  pluginCreationAllowed: boolean;
  token: string | undefined;
  tokenVersion: number;
  isSuperAdmin: boolean;
}
/**
 * This describes the schema for a `AppUserProfile` that corresponds to `InterfaceAppUserProfile` document.
 * @param user - User id of the AppUserProfile
 * @param adminFor - Collection of organization where appuser is admin, each object refer to `Organization` model.
 * @param appLanguageCode - AppUser's app language code.
 * @param adminApproved - Boolean indicating if the User is approved by the admin to be part of the Organisation
 * @param createdEvents - Collection of all events created by the user, each object refer to `Event` model.
 * @param createdOrganizations - Collection of all organization created by the user, each object refer to `Organization` model.
 * @param eventAdmin - Collection of the event admins, each object refer to `Event` model.
 * @param pluginCreationAllowed - Wheather user is allowed to create plugins.
 * @param tokenVersion - Token version.
 * @param isSuperAdmin - Wheather user is super admin.
 * @param token - Access token.
 *  */

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
    adminApproved: {
      type: Boolean,
      required: true,
      default: false,
    },
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
