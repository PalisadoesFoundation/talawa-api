import type { Document, PaginateModel, PopulatedDoc, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import validator from "validator";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceAppUserProfile } from "./AppUserProfile";
import type { InterfaceEvent } from "./Event";
import type { InterfaceMembershipRequest } from "./MembershipRequest";
import type { InterfaceOrganization } from "./Organization";
import { identifier_count } from "./IdentifierCount";

/**
 * Represents a MongoDB document for User in the database.
 */
export interface InterfaceUser {
  _id: Types.ObjectId;
  identifier: number;
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
  password?: string | null;
  phone: {
    home: string;
    mobile: string;
    work: string;
  };
  eventsAttended: PopulatedDoc<InterfaceEvent & Document>[];

  registeredEvents: PopulatedDoc<InterfaceEvent & Document>[];
  status: string;

  updatedAt: Date;
}

/**
 * Mongoose schema definition for User documents.
 * @param appUserProfileId - Reference to the user's app profile.
 * @param identifier - unique numeric identifier for each User
 * @param address - User's address details.
 * @param birthDate - User's date of birth.
 * @param createdAt - Timestamp of when the user was created.
 * @param educationGrade - User's highest education grade.
 * @param email - User's email address (validated as an email).
 * @param employmentStatus - User's employment status.
 * @param firstName - User's first name.
 * @param gender - User's gender.
 * @param image - URL to the user's image.
 * @param joinedOrganizations - Organizations the user has joined.
 * @param lastName - User's last name.
 * @param maritalStatus - User's marital status.
 * @param membershipRequests - Membership requests made by the user.
 * @param organizationsBlockedBy - Organizations that have blocked the user.
 * @param password - User's hashed password.
 * @param phone - User's contact numbers (home, mobile, work).
 * @param registeredEvents - Events the user has registered for.
 * @param status - User's status (ACTIVE, BLOCKED, DELETED).
 * @param eventsAttended - Events the user has attended.
 * @param updatedAt - Timestamp of when the user was last updated.
 */
const userSchema = new Schema(
  {
    identifier: {
      type: Number,
      unique: true,
      required: true,
      immutable: true,
    },
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
      lowercase: true,
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
    eventsAttended: [
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

userSchema.pre<InterfaceUser>("validate", async function (next) {
  if (!this.identifier) {
    const counter = await identifier_count.findOneAndUpdate(
      { _id: "userCounter" },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true },
    );

    this.identifier = counter.sequence_value;
  }
  return next();
});

// Create and export the User model
const userModel = (): PaginateModel<InterfaceUser> =>
  model<InterfaceUser, PaginateModel<InterfaceUser>>("User", userSchema);

createLoggingMiddleware(userSchema, "User");

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const User = (models.User || userModel()) as ReturnType<
  typeof userModel
>;
