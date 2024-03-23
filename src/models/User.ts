import type { Document, PaginateModel, PopulatedDoc, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import validator from "validator";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceAppUserProfile } from "./AppUserProfile";
import type { InterfaceEvent } from "./Event";
import type { InterfaceMembershipRequest } from "./MembershipRequest";
import type { InterfaceOrganization } from "./Organization";

/**
 * This is an interface that represents a database(MongoDB) document for User.
 */
export interface InterfaceUser {
  _id: Types.ObjectId;
  appUserProfileId: PopulatedDoc<InterfaceAppUserProfile & Document>;
  address: {
    city: string;
    countryCode: string;
    dependentLocality: string;
    line1: string;
    line2: string;
    postalCode: string;
    sortingCode: string;
    state: string;
  };

  birthDate: Date;
  createdAt: Date;

  educationGrade: string;
  email: string;
  employmentStatus: string;

  firstName: string;
  gender: string;
  image: string | undefined | null;
  joinedOrganizations: PopulatedDoc<InterfaceOrganization & Document>[];
  lastName: string;
  maritalStatus: string;
  membershipRequests: PopulatedDoc<InterfaceMembershipRequest & Document>[];
  organizationsBlockedBy: PopulatedDoc<InterfaceOrganization & Document>[];
  password?: string;
  phone: {
    home: string;
    mobile: string;
    work: string;
  };

  registeredEvents: PopulatedDoc<InterfaceEvent & Document>[];
  status: string;

  updatedAt: Date;
  userType: string;
}
/**
 * This describes the schema for a `User` that corresponds to `InterfaceUser` document.
 * @param appUserProfileId - AppUserProfile id of the User
 * @param address - User address

 * @param birthDate - User Date of birth
 * @param createdAt - Time stamp of data creation.
 
 * @param educationGrade - User highest education degree
 * @param email - User email id.
 * @param employmentStatus - User employment status
 
 * @param firstName - User First Name.
 * @param gender - User gender
 * @param image - User Image URL.
 * @param joinedOrganizations - Collection of the organization where user is the member, each object refer to `Organization` model.
 * @param lastName - User Last Name.
 * @param maritalStatus - User marital status
 * @param membershipRequests - Collections of the membership request, each object refer to `MembershipRequest` model.
 * @param organizationsBlockedBy - Collections of organizations where user is blocked, each object refer to `Organization` model.
 * @param password - User hashed password.
 * @param phone - User contact numbers, for mobile, home and work
 
 * @param registeredEvents - Collection of user registered Events, each object refer to `Event` model.
 * @param status - Status
 *

 * @param updatedAt - Timestamp of data updation

 */
const userSchema = new Schema(
  {
    appUserProfileId: {
      type: Schema.Types.ObjectId,
      ref: "AppUserProfile",
    },
    address: {
      city: {
        type: String,
      },
      countryCode: {
        type: String,
      },
      dependentLocality: {
        type: String,
      },
      line1: {
        type: String,
      },
      line2: {
        type: String,
      },
      postalCode: {
        type: String,
      },
      sortingCode: {
        type: String,
      },
      state: {
        type: String,
      },
    },
    birthDate: {
      type: Date,
    },

    educationGrade: {
      type: String,
      enum: [
        "NO_GRADE",
        "PRE_KG",
        "KG",
        "GRADE_1",
        "GRADE_2",
        "GRADE_3",
        "GRADE_4",
        "GRADE_5",
        "GRADE_6",
        "GRADE_7",
        "GRADE_8",
        "GRADE_9",
        "GRADE_10",
        "GRADE_11",
        "GRADE_12",
        "GRADUATE",
        null,
      ],
    },
    email: {
      type: String,
      required: true,
      validate: [validator.isEmail, "invalid email"],
    },
    employmentStatus: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "UNEMPLOYED", null],
    },

    firstName: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER", null],
    },
    image: {
      type: String,
    },
    joinedOrganizations: [
      {
        type: Schema.Types.ObjectId,
        ref: "Organization",
      },
    ],
    lastName: {
      type: String,
      required: true,
    },
    maritalStatus: {
      type: String,
      enum: [
        "SINGLE",
        "ENGAGED",
        "MARRIED",
        "DIVORCED",
        "WIDOWED",
        "SEPERATED",
        null,
      ],
    },
    membershipRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: "MembershipRequest",
      },
    ],
    organizationsBlockedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "Organization",
      },
    ],
    password: {
      type: String,
      required: true,
    },
    phone: {
      home: {
        type: String,
      },
      mobile: {
        type: String,
      },
      work: {
        type: String,
      },
    },

    registeredEvents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "BLOCKED", "DELETED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

userSchema.plugin(mongoosePaginate);

const userModel = (): PaginateModel<InterfaceUser> =>
  model<InterfaceUser, PaginateModel<InterfaceUser>>("User", userSchema);

createLoggingMiddleware(userSchema, "User");

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const User = (models.User || userModel()) as ReturnType<
  typeof userModel
>;
