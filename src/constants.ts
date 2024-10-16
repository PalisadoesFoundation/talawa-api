import crypto from "crypto";
import { envSchema, getEnvIssues } from "./env";
import "dotenv/config";

const issues = getEnvIssues();
let ENV = process.env;
if (!issues) {
  ENV = envSchema.parse(process.env);
}

export const ACTION_ITEM_NOT_FOUND_ERROR = Object.freeze({
  DESC: "ActionItem not found",
  CODE: "actionItem.notFound",
  MESSAGE: "actionItem.notFound",
  PARAM: "actionItem",
});

export const ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR = Object.freeze({
  DESC: "ActionItemCategory not found",
  CODE: "actionItemCategory.notFound",
  MESSAGE: "actionItemCategory.notFound",
  PARAM: "actionItemCategory",
});

export const ACTION_ITEM_CATEGORY_ALREADY_EXISTS = Object.freeze({
  DESC: "Action Item Category already exists",
  CODE: "actionItemCategory.alreadyExists",
  MESSAGE: "actionItemCategory.alreadyExists",
  PARAM: "actionItemCategory",
});

export const ACTION_ITEM_CATEGORY_IS_DISABLED = Object.freeze({
  DESC: "Action Item Category is disabled",
  CODE: "actionItemCategory.isDisabled",
  MESSAGE: "actionItemCategory.isDisabled",
  PARAM: "actionItemCategory",
});

export const AGENDA_CATEGORY_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Agenda category not found",
  CODE: "agendaCategory.notFound",
  MESSAGE: "agendaCategory.notFound",
  PARAM: "agendaCategory",
});

export const APP_USER_PROFILE_NOT_FOUND_ERROR = Object.freeze({
  DESC: "appUserProfile not found",
  CODE: "appUserProfile.notFound",
  MESSAGE: "appUserProfile.notFound",
  PARAM: "appUserProfile",
});

export const BASE_RECURRING_EVENT_NOT_FOUND = Object.freeze({
  DESC: "Base Recurring Event not found",
  CODE: "baseRecurringEvent.notFound",
  MESSAGE: "baseRecurringEvent.notFound",
  PARAM: "baseRecurringEvent",
});

export const CHAT_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Chat not found",
  CODE: "chat.notFound",
  MESSAGE: "chat.notFound",
  PARAM: "chat",
});

export const MESSAGE_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Message not found",
  CODE: "message.notFound",
  MESSAGE: "message.notFound",
  PARAM: "message",
});

export const COMMUNITY_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Community not found",
  CODE: "community.notFound",
  MESSAGE: "community.notFound",
  PARAM: "community",
});

export const VENUE_ALREADY_EXISTS_ERROR = Object.freeze({
  DESC: "Venue already exists",
  CODE: "venue.alreadyExists",
  MESSAGE: "venue.alreadyExists",
  PARAM: "venue",
});

export const VENUE_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Venue does not exist",
  CODE: "venue.NotFound",
  MESSAGE: "venue.NotFound",
  PARAM: "venue",
});

export const COMMENT_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Comment not found",
  CODE: "comment.notFound",
  MESSAGE: "comment.notFound",
  PARAM: "comment",
});

export const COMMUNITY_LOGO_NOT_MISSING_IN_ARGS = Object.freeze({
  DESC: "Community logo was not provided",
  CODE: "community.logoMissing",
  MESSAGE: "community.logoMissing",
  PARAM: "community",
});

export const ERROR_IN_SENDING_MAIL = "Error in sending mail";

export const EVENT_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Event not found",
  CODE: "event.notFound",
  MESSAGE: "event.notFound",
  PARAM: "event",
});

export const FEEDBACK_ALREADY_SUBMITTED = Object.freeze({
  MESSAGE: "The user has already submitted a feedback for this event.",
  CODE: "feedback.alreadySubmitted",
  PARAM: "feedback.alreadySubmitted",
});
export const FUND_ALREADY_EXISTS = Object.freeze({
  DESC: "Fund already exists",
  CODE: "fund.alreadyExists",
  MESSAGE: "fund.alreadyExists",
  PARAM: "fund",
});
export const FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR = Object.freeze({
  DESC: "FundraisingCampaign not found",
  CODE: "fundraisingCampaign.notFound",
  MESSAGE: "fundraisingCampaign.notFound",
  PARAM: "fundraisingCampaign",
});
export const FUNDRAISING_CAMPAIGN_ALREADY_EXISTS = Object.freeze({
  DESC: "Fundraising Campaign already exists",
  CODE: "fundraisingCampaign.alreadyExists",
  MESSAGE: "fundraisingCampaign.alreadyExists",
  PARAM: "fundraisingCampaign",
});
export const FUNDRAISING_CAMPAIGN_ALREADY_ADDED = Object.freeze({
  DESC: "Fundraising Campaign already added",
  CODE: "fundraisingCampaign.alreadyAdded",
  MESSAGE: "fundraisingCampaign.alreadyAdded",
  PARAM: "fundraisingCampaign",
});
export const FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR = Object.freeze({
  DESC: "FundraisingCampaignPledge not found",
  CODE: "fundraisingCampaignPledge.notFound",
  MESSAGE: "fundraisingCampaignPledge.notFound",
  PARAM: "fundraisingCampaignPledge",
});
export const FUNDRAISING_CAMPAIGN_PLEDGE_ALREADY_EXISTS = Object.freeze({
  DESC: "Fundraising Campaign Pledge already exists",
  CODE: "fundraisingCampaignPledge.alreadyExists",
  MESSAGE: "fundraisingCampaignPledge.alreadyExists",
  PARAM: "fundraisingCampaignPledge",
});
export const FUND_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Fund not found",
  CODE: "fund.notFound",
  MESSAGE: "fund.notFound",
  PARAM: "fund",
});
export const INVALID_OTP = "Invalid OTP";

export const IN_PRODUCTION = process.env.NODE_ENV === "production";

export const INVALID_TIMEOUT_RANGE = Object.freeze({
  DESC: "Timeout should be in the range of 15 to 60 minutes.",
  CODE: "invalid.timeoutRange",
  MESSAGE: "invalid.timeoutRange",
  PARAM: "timeout",
});

export const MEMBER_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Member not found",
  CODE: "member.notFound",
  MESSAGE: "member.notFound",
  PARAM: "member",
});
export const MEMBERSHIP_REQUEST_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Membership Request not found",
  CODE: "membershipRequest.notFound",
  MESSAGE: "membershipRequest.notFound",
  PARAM: "membershipRequest",
});

export const MEMBERSHIP_REQUEST_ALREADY_EXISTS = Object.freeze({
  DESC: "Membership Request already exists",
  CODE: "membershipRequest.alreadyExists",
  MESSAGE: "membershipRequest.alreadyExists",
  PARAM: "membershipRequest",
});

export const ORGANIZATION_MEMBER_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Organization's user is not a member",
  CODE: "organization.member.notFound",
  MESSAGE: "organization.member.notFound",
  PARAM: "organizationMember",
});
export const ORGANIZATION_NOT_AUTHORIZED_ERROR = Object.freeze({
  DESC: "Organization is not authorized",
  CODE: "org.notAuthorized",
  MESSAGE: "org.notAuthorized",
  PARAM: "org",
});
export const ORGANIZATION_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Organization not found",
  CODE: "organization.notFound",
  MESSAGE: "organization.notFound",
  PARAM: "organization",
});

export const RECURRENCE_RULE_NOT_FOUND = Object.freeze({
  DESC: "Recurrence Rule not found",
  CODE: "recurrenceRule.notFound",
  MESSAGE: "recurrenceRule.notFound",
  PARAM: "recurrenceRule",
});

export const VENUE_NAME_MISSING_ERROR = Object.freeze({
  DESC: "Venue name not found",
  CODE: "venueName.notFound",
  MESSAGE: "venueName.notFound",
  PARAM: "venueName",
});

export const VENUE_ALREADY_SCHEDULED = Object.freeze({
  DESC: "Venue is already scheduled",
  CODE: "venue.alreadySchduled",
  MESSAGE: "venue.alreadySchduled",
  PARAM: "venue",
});

export const ORGANIZATION_IMAGE_NOT_FOUND_ERROR = Object.freeze({
  DESC: "OrganizationImage not found",
  CODE: "organizationImage.notFound",
  MESSAGE: "organizationImage.notFound",
  PARAM: "organizationImage",
});
export const PLUGIN_NOT_FOUND = Object.freeze({
  DESC: "Plugin not found",
  CODE: "plugin.notFound",
  MESSAGE: "plugin.notFound",
  PARAM: "plugin",
});
export const POST_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Post not found",
  CODE: "post.notFound",
  MESSAGE: "post.notFound",
  PARAM: "post",
});
export const REGISTRANT_ALREADY_EXIST_ERROR = Object.freeze({
  DESC: "Already registered for the event",
  CODE: "registrant.alreadyExist",
  MESSAGE: "registrant.alreadyExist",
  PARAM: "registrant",
});

export const INVALID_FILE_TYPE = Object.freeze({
  MESSAGE: "invalid.fileType",
  CODE: "internalServerError",
  PARAM: "internalServerError",
});

export const IMAGE_SIZE_LIMIT_KB = Object.freeze({
  MESSAGE: "The Image Size Limit has been exceeded",
  CODE: "internalServerError",
  PARAM: "internalServerError",
});

export const INVALID_ROLE_TYPE = Object.freeze({
  DESC: "Invalid Role Type",
  MESSAGE: "invalid.roleType",
  CODE: "internalServerError",
  PARAM: "internalServerError",
});

export const SAME_FILE_ERROR = Object.freeze({
  MESSAGE: "The newer image is the same as the previous image in the database",
  CODE: "internalServerError",
  PARAM: "internalServerError",
});

export const INTERNAL_SERVER_ERROR = Object.freeze({
  MESSAGE: "Internal Server Error!",
  CODE: "internalServerError",
  PARAM: "internalServerError",
});

export const UNAUTHENTICATED_ERROR = Object.freeze({
  MESSAGE: "UnauthenticatedError",
  CODE: "user.notAuthenticated",
  PARAM: "userAuthentication",
});

export const END_DATE_VALIDATION_ERROR = Object.freeze({
  MESSAGE: "Error: End date must be greater than or equal to start date.",
  CODE: "enddate.notvalid",
  PARAM: "dateValidation",
});

export const START_DATE_VALIDATION_ERROR = Object.freeze({
  MESSAGE: "Error: Start date must be greater than or equal to current date.",
  CODE: "startdate.notvalid",
  PARAM: "dateValidation",
});

export const FIELD_NON_EMPTY_ERROR = Object.freeze({
  MESSAGE:
    "Error: Field cannot be null, an empty string, or contain only spaces.",
  CODE: "field_non_empty_error",
  PARAM: "field",
});

export const LENGTH_VALIDATION_ERROR = Object.freeze({
  MESSAGE: "Error: Length must be greater than 0 and less than",
  CODE: "string.notValid",
  PARAM: "stringValidation",
});

export const USER_FAMILY_MIN_MEMBERS_ERROR_CODE = Object.freeze({
  MESSAGE: "InputValidationError",
  CODE: "membersInUserFamilyLessThanOne",
  PARAM: "membersInUserFamilyLessThanOne",
});

export const REGEX_VALIDATION_ERROR = Object.freeze({
  MESSAGE: "Error: Entered value must be a valid string",
  CODE: "string.notValid",
  PARAM: "stringValidation",
});

export const USER_FAMILY_NOT_FOUND_ERROR = Object.freeze({
  MESSAGE: "Error: User Family Not Found",
  CODE: "userfamilyNotFound",
  PARAM: "userfamilyNotFound",
});

export const USER_NOT_AUTHORIZED_SUPERADMIN = Object.freeze({
  MESSAGE: "Error: Current user must be a SUPERADMIN",
  CODE: "role.notValid.superadmin",
  PARAM: "roleValidationSuperAdmin",
});

export const USER_NOT_AUTHORIZED_ADMIN = Object.freeze({
  MESSAGE: "Error: Current user must be an ADMIN or a SUPERADMIN",
  CODE: "role.notValid.admin",
  PARAM: "roleValidationAdmin",
});

export const USER_ALREADY_REGISTERED_FOR_EVENT = Object.freeze({
  MESSAGE: "The user has already been registered for the event",
  CODE: "user.alreadyRegistered",
  PARAM: "user.alreadyRegistered",
});

export const USER_ALREADY_INVITED_FOR_EVENT = Object.freeze({
  MESSAGE: "The user has already been invited for the event",
  CODE: "user.alreadyInvited",
  PARAM: "user.alreadyInvited",
});

export const USER_NOT_REGISTERED_FOR_EVENT = Object.freeze({
  MESSAGE: "The user is not registered for the event",
  CODE: "user.notRegistered",
  PARAM: "user.notRegistered",
});

export const USER_NOT_CHECKED_IN = Object.freeze({
  MESSAGE: "The user did not check in for the event.",
  CODE: "user.notCheckedIn",
  PARAM: "user.notCheckedIn",
});

export const USER_NOT_ORGANIZATION_ADMIN = Object.freeze({
  MESSAGE: "Error: User must be an ADMIN",
  CODE: "role.notValid.admin",
  PARAM: "roleValidationAdmin",
});

export const USER_BLOCKING_SELF = Object.freeze({
  MESSAGE: "Error: Current user cannot block self",
  CODE: "user.selfBlock",
  PARAM: "userSelfBlock",
});

export const USER_REMOVING_SELF = Object.freeze({
  MESSAGE:
    "Error: Current user cannot remove self, instead you can use leave Org function",
  CODE: "user.selfRemove",
  PARAM: "userSelfRemove",
});

export const ADMIN_REMOVING_ADMIN = Object.freeze({
  MESSAGE: "Error: Current admin cannot remove another admin",
  CODE: "admin.removeAdmin",
  PARAM: "admin.removeAdmin",
});

export const ADMIN_REMOVING_CREATOR = Object.freeze({
  MESSAGE: "Error: Current admin cannot remove the creator of the Org",
  CODE: "admin.removeCreator",
  PARAM: "admin.removeCreator",
});

export const ADMIN_CHANGING_ROLE_OF_CREATOR = Object.freeze({
  MESSAGE:
    "Error: Current admin cannot change the role of the creator of the Org",
  CODE: "admin.changeRoleOfCreator",
  PARAM: "admin.changeRoleOfCreator",
});

export const ADMIN_CANNOT_CHANGE_ITS_ROLE = Object.freeze({
  MESSAGE: "Error: Current admin cannot change its own role",
  CODE: "admin.changeOwnRole",
  PARAM: "admin.changeOwnRole",
});

export const POST_NEEDS_TO_BE_PINNED = Object.freeze({
  MESSAGE: "Post needs to be pinned inorder to add a title",
  CODE: "post.notAllowedToAddTitle",
  PARAM: "post.notAllowedToAddTitle",
});

export const PLEASE_PROVIDE_TITLE = Object.freeze({
  MESSAGE: "Please provide a title to pin post",
  CODE: "post.provideTitle",
  PARAM: "post.provideTitle",
});

export const USER_NOT_AUTHORIZED_TO_PIN = Object.freeze({
  MESSAGE:
    "The user must be a superadmin or an admin of the organization to pin/unpin posts",
  CODE: "user.notAuthorizedToPin",
  PARAM: "user.notAuthorizedToPin",
});

export const TAG_NOT_FOUND = Object.freeze({
  MESSAGE: "The tag with the specified ID doesn't exist.",
  CODE: "tag.doesNotExist",
  PARAM: "tag.doesNotExist",
});

export const USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION = Object.freeze({
  MESSAGE:
    "The user to which the tag is being assigned hasn't joined the tag's parent organization.",
  CODE: "user.notJoinedOrg",
  PARAM: "user.notJoinedOrg",
});

export const INVALID_TAG_INPUT = Object.freeze({
  MESSAGE:
    "Either an organizatin ID or a parent tag ID must be provided for this operation.",
  CODE: "invalidArgs",
  PARAM: "invalidArgs",
});

export const INCORRECT_TAG_INPUT = Object.freeze({
  MESSAGE: "The tag does not belong to the organization provided.",
  CODE: "invalidArgs.tag",
  PARAM: "invalidArgs.tag",
});

export const NO_CHANGE_IN_TAG_NAME = Object.freeze({
  MESSAGE:
    "The tag name is the already set to the value it is being requested to be changed to.",
  CODE: "invalidArgs.tagName",
  PARAM: "invalidArgs.tagName",
});

export const TAG_ALREADY_EXISTS = Object.freeze({
  MESSAGE:
    "A tag with the same name and the same parent tag already exists for this organization.",
  CODE: "tag.alreadyExists",
  PARAM: "tag.alreadyExists",
});

export const USER_NOT_AUTHORIZED_TO_CREATE_TAG = Object.freeze({
  MESSAGE:
    "The user must be a superadmin or an admin of the organization to create the tag.",
  CODE: "user.notAuth.createTag",
  PARAM: "user.notAuth.createTag",
});

export const USER_ALREADY_HAS_TAG = Object.freeze({
  MESSAGE:
    "The user already has the tag that it is being requested to assigned.",
  CODE: "user.alreadyHasTag",
  PARAM: "user.alreadyHasTag",
});

export const USER_DOES_NOT_HAVE_THE_TAG = Object.freeze({
  MESSAGE:
    "The user does not have the tag that is being requested to be removed.",
  CODE: "user.doesNotHaveTag",
  PARAM: "user.doesNotHaveTag",
});

export const ADVERTISEMENT_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Advertisement not found",
  CODE: "advertisement.notFound",
  MESSAGE: "advertisement.notFound",
  PARAM: "advertisement",
});
export const INPUT_NOT_FOUND_ERROR = Object.freeze({
  MESSAGE: "Input not found",
  CODE: "Input.required",
  PARAM: "advertisement",
});
export const STATUS_ACTIVE = "ACTIVE";

export const URL =
  process.env.NODE_ENV === "test"
    ? "http://localhost:4000/graphql"
    : "http://calico.palisadoes.org/talawa/graphql";

export const USER_ALREADY_MEMBER_ERROR = Object.freeze({
  DESC: "User is already a member",
  CODE: "user.alreadyMember",
  MESSAGE: "user.alreadyMember",
  PARAM: "user",
});
export const USER_ALREADY_UNREGISTERED_ERROR = Object.freeze({
  DESC: "Already registered for the event",
  CODE: "registrant.alreadyUnregistered",
  MESSAGE: "registrant.alreadyUnregistered",
  PARAM: "registrant",
});
export const USER_NOT_AUTHORIZED_ERROR = Object.freeze({
  DESC: "User is not authorized for performing this operation",
  CODE: "user.notAuthorized",
  MESSAGE: "user.notAuthorized",
  PARAM: "user",
});

export const UNAUTHORIZED_REMOVE_AGENDA_ITEM_ERROR = Object.freeze({
  DESC: "Unauthorized to remove the agenda item",
  CODE: "unauthorized.removeAgendaItem",
  MESSAGE: "Unauthorized to remove the agenda item",
  PARAM: "agendaItem",
});

export const UNAUTHORIZED_UPDATE_AGENDA_ITEM_ERROR = Object.freeze({
  DESC: "Unauthorized to update the agenda item",
  CODE: "unauthorized.updateAgendaItem",
  MESSAGE: "Unauthorized to update the agenda item",
  PARAM: "agendaItem",
});

export const AGENDA_ITEM_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Agenda item not found",
  CODE: "agendaItem.notFound",
  MESSAGE: "agendaItem.notFound",
  PARAM: "agendaItem",
});
export const AGENDA_ITEM_CREATION_ERROR = Object.freeze({
  DESC: "Agenda item not created",
  CODE: "agendaItem.notCreated",
  MESSAGE: "agendaItem.notCreated",
  PARAM: "agendaItem",
});
export const AGENDA_SECTION_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Agenda section not found",
  CODE: "agendaSection.notFound",
  MESSAGE: "agendaSection.notFound",
  PARAM: "agendaSection",
});
export const NOTE_NOT_FOUND_ERROR = Object.freeze({
  MESSAGE: "Error: Note not found",
  CODE: "note.notFound",
  PARAM: "noteValidation",
});

export const UNAUTHORIZED_REMOVE_NOTE_ERROR = Object.freeze({
  MESSAGE: "Error: Unauthorized to remove note",
  CODE: "note.unauthorizedRemove",
  PARAM: "noteRemovalValidation",
});

export const UNAUTHORIZED_UPDATE_NOTE_ERROR = Object.freeze({
  MESSAGE: "Error: Unauthorized to update note",
  CODE: "note.unauthorizedUpdate",
  PARAM: "noteUpdateValidation",
});

export const USER_NOT_FOUND_ERROR = Object.freeze({
  DESC: "User not found",
  CODE: "user.notFound",
  MESSAGE: "user.notFound",
  PARAM: "user",
});
export const USER_NOT_MADE_PLEDGE_ERROR = Object.freeze({
  DESC: "User has not made a pledge",
  CODE: "user.notPledged",
  MESSAGE: "user.notPledged",
  PARAM: "user",
});
export const USER_NOT_MEMBER_FOR_ORGANIZATION = Object.freeze({
  DESC: "User is not a member of the organization",
  CODE: "user.notMember",
  MESSAGE: "user.notMember",
  PARAM: "user",
});
export const USER_TO_BE_REMOVED_NOT_FOUND_ERROR = Object.freeze({
  DESC: "User to be removed not found",
  CODE: "user.notFound",
  MESSAGE: "user.notFound",
  PARAM: "user",
});
export const SUPERADMIN_CANT_CHANGE_OWN_ROLE = Object.freeze({
  MESSAGE:
    "Superadmin's are not allowed to change their own roles. This is done as SUPERADMIN is the highest level of access to the system, and downgrading their own role may result in them being locked out of the system.",
  CODE: "superadmin.NotChangeSelf",
  PARAM: "superadmin.NotChangeSelf",
});
export const TRANSLATION_ALREADY_PRESENT_ERROR = Object.freeze({
  DESC: "Translation Already Present",
  CODE: "translation.alreadyPresent",
  MESSAGE: "translation.alreadyPresent",
  PARAM: "translationAlreadyPresent",
});
export const INVALID_CREDENTIALS_ERROR = Object.freeze({
  DESC: "Invalid credentials",
  CODE: "invalid.credentials",
  MESSAGE: "invalid.credentials",
  PARAM: "credentials",
});
export const INVALID_REFRESH_TOKEN_ERROR = Object.freeze({
  DESC: "Invalid refreshToken",
  CODE: "invalid.refreshToken",
  MESSAGE: "invalid.refreshToken",
  PARAM: "refreshToken",
});

export const USER_PROFILE_IMAGE_NOT_FOUND_ERROR = Object.freeze({
  DESC: "User profile image not found",
  CODE: "user.profileImage.notFound",
  MESSAGE: "user.profileImage.notFound",
  PARAM: "userProfileImage",
});

export const EMAIL_ALREADY_EXISTS_ERROR = Object.freeze({
  DESC: "Email already exists",
  CODE: "email.alreadyExists",
  MESSAGE: "email.alreadyExists",
  PARAM: "email",
});

export const EVENT_VOLUNTEER_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Volunteer not found",
  CODE: "eventVolunteer.notFound",
  MESSAGE: "eventVolunteer.notFound",
  PARAM: "eventVolunteers",
});

export const EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR = Object.freeze({
  DESC: "Volunteer group not found",
  CODE: "eventVolunteerGroup.notFound",
  MESSAGE: "eventVolunteerGroup.notFound",
  PARAM: "eventVolunteerGroup",
});

export const EVENT_VOLUNTEER_INVITE_USER_MISTMATCH = Object.freeze({
  DESC: "Current User is not the user of Event Volunteer",
  CODE: "eventVolunteer.userMismatch",
  MESSAGE: "eventVolunteer.userMismatch",
  PARAM: "eventVolunteers",
});

export const USER_ALREADY_CHECKED_IN = Object.freeze({
  MESSAGE: "The user has already been checked in for this event.",
  CODE: "user.alreadyCheckedIn",
  PARAM: "user.alreadyCheckedIn",
});

export const USER_ALREADY_CHECKED_OUT = Object.freeze({
  MESSAGE: "The user has already been checked out for this event.",
  CODE: "user.alreadyCheckedOut",
  PARAM: "user.alreadyCheckedOut",
});

export const SAMPLE_ORGANIZATION_ALREADY_EXISTS = Object.freeze({
  DESC: "Sample Organization was already generated",
  CODE: "sampleOrganization.duplicate",
  MESSAGE: "sampleOrganization.duplicate",
  PARAM: "sampleOrganization",
});

export const CUSTOM_DATA_NOT_FOUND = Object.freeze({
  MESSAGE: "Unable to remove non-existent custom data",
  CODE: "customData.notFound",
  PARAM: "customData.notFound",
});

export const CUSTOM_FIELD_NOT_FOUND = Object.freeze({
  MESSAGE: "Unable to remove non-existent custom field",
  CODE: "customField.notFound",
  PARAM: "customField.notFound",
});

export const CUSTOM_FIELD_NAME_MISSING = Object.freeze({
  MESSAGE: "The name of the custom field is missing",
  CODE: "customField.isMissing",
  PARAM: "customField.isMissing",
});

export const CUSTOM_FIELD_TYPE_MISSING = Object.freeze({
  MESSAGE: "The type of the custom field is missing",
  CODE: "customField.isMissing",
  PARAM: "customField.isMissing",
});

export const ATTENDEE_NOT_FOUND = Object.freeze({
  DESC: "Attendee not found",
  CODE: "attendee.notFound",
  MESSAGE: "attendee.notFound",
  PARAM: "attendee",
});

export const PRELOGIN_IMAGERY_FIELD_EMPTY = Object.freeze({
  MESSAGE: "Website name, website link and the website logo cannot be empty",
  CODE: "preLoginImagery.empty",
  PARAM: "preLoginImagery.empty",
});

export const MINIMUM_TIMEOUT_MINUTES = 15;
export const MAXIMUM_TIMEOUT_MINUTES = 60;

export const MAXIMUM_FETCH_LIMIT = 100;

export const MAXIMUM_IMAGE_SIZE_LIMIT_KB = 20000;

export const BASE_URL = `http://localhost:${process.env.port || 4000}/`;

export const SERVER_PORT = ENV.SERVER_PORT;

export const ACCESS_TOKEN_SECRET = ENV.ACCESS_TOKEN_SECRET;

export const REFRESH_TOKEN_SECRET = ENV.REFRESH_TOKEN_SECRET;

export const MONGO_DB_URL = ENV.MONGO_DB_URL;

export const RECAPTCHA_SECRET_KEY = ENV.RECAPTCHA_SECRET_KEY;

export const MAIL_USERNAME = ENV.MAIL_USERNAME;

export const MAIL_PASSWORD = ENV.MAIL_PASSWORD;

export const LAST_RESORT_SUPERADMIN_EMAIL =
  process.env.LAST_RESORT_SUPERADMIN_EMAIL;

export const SMTP_OPTIONS = {
  IS_SMTP: process.env.IS_SMTP === "true",
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_USERNAME: process.env.SMTP_USERNAME,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SSL_TLS: process.env.SMTP_SSL_TLS === "true",
};

export const REDIS_HOST = process.env.REDIS_HOST || "";
export const REDIS_PORT = Number(process.env.REDIS_PORT);
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

export const MILLISECONDS_IN_A_WEEK = 7 * 24 * 60 * 60 * 1000;

// recurring event frequencies
export const RECURRENCE_FREQUENCIES = ["YEARLY", "MONTHLY", "WEEKLY", "DAILY"];

// recurring instance generation date limit in years based on it's frequency
export const RECURRING_EVENT_INSTANCES_DAILY_LIMIT = 1;
export const RECURRING_EVENT_INSTANCES_WEEKLY_LIMIT = 2;
export const RECURRING_EVENT_INSTANCES_MONTHLY_LIMIT = 5;
export const RECURRING_EVENT_INSTANCES_YEARLY_LIMIT = 10;

// recurrence rules query date limit in years
// i.e. query limit date to find the pending recurrence patterns
// and then generate new instances ahead of this date
export const RECURRING_EVENT_INSTANCES_QUERY_LIMIT = 1;

// recurring event days
export const RECURRENCE_WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const RECURRENCE_WEEKDAYS_MAPPING = {
  MONDAY: "MO",
  TUESDAY: "TU",
  WEDNESDAY: "WE",
  THURSDAY: "TH",
  FRIDAY: "FR",
  SATURDAY: "SA",
  SUNDAY: "SU",
};

export const key = ENV.ENCRYPTION_KEY as string;
export const iv = crypto.randomBytes(16).toString("hex");

export const LOG = ENV.LOG === "true";

export const LOG_PATH = ENV.LOG_PATH;

export enum TransactionLogTypes {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

export enum EventVolunteerResponse {
  YES = "YES",
  NO = "NO",
}

export const DEFAULT_COMMUNITY = {
  name: "Palisadoes Foundation",
  description: "An open source application by Palisadoes Foundation volunteers",
};
