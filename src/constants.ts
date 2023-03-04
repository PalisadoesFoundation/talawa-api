export const CHAT_NOT_FOUND = "Chat not found";
export const CHAT_NOT_FOUND_CODE = "chat.notFound";
export const CHAT_NOT_FOUND_MESSAGE = "chat.notFound";
export const CHAT_NOT_FOUND_PARAM = "chat";

export const COMMENT_NOT_FOUND = "Comment not found";
export const COMMENT_NOT_FOUND_CODE = "comment.notFound";
export const COMMENT_NOT_FOUND_MESSAGE = "comment.notFound";
export const COMMENT_NOT_FOUND_PARAM = "comment";

export const ERROR_IN_SENDING_MAIL = "Error in sending mail";

export const EVENT_NOT_FOUND = "Event not found";
export const EVENT_NOT_FOUND_CODE = "event.notFound";
export const EVENT_NOT_FOUND_MESSAGE = "event.notFound";
export const EVENT_NOT_FOUND_PARAM = "event";

export const EVENT_PROJECT_NOT_FOUND = "EventProject not found";
export const EVENT_PROJECT_NOT_FOUND_CODE = "eventProject.notFound";
export const EVENT_PROJECT_NOT_FOUND_MESSAGE = "eventProject.notFound";
export const EVENT_PROJECT_NOT_FOUND_PARAM = "eventProject";

export const INVALID_OTP = "Invalid OTP";

export const IN_PRODUCTION = process.env.NODE_ENV === "production";

export const MEMBER_NOT_FOUND = "Member not found";
export const MEMBER_NOT_FOUND_CODE = "member.notFound";
export const MEMBER_NOT_FOUND_MESSAGE = "member.notFound";
export const MEMBER_NOT_FOUND_PARAM = "member";

export const MEMBERSHIP_REQUEST_NOT_FOUND = "Membership Request not found";
export const MEMBERSHIP_REQUEST_NOT_FOUND_CODE = "membershipRequest.notFound";
export const MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE =
  "membershipRequest.notFound";
export const MEMBERSHIP_REQUEST_NOT_FOUND_PARAM = "membershipRequest";

export const MEMBERSHIP_REQUEST_ALREADY_EXISTS =
  "Membership Request already exists";

export const ORGANIZATION_MEMBER_NOT_FOUND =
  "Organization's user is not a member";
export const ORGANIZATION_MEMBER_NOT_FOUND_CODE =
  "organization.member.notFound";
export const ORGANIZATION_MEMBER_NOT_FOUND_MESSAGE =
  "organization.member.notFound";
export const ORGANIZATION_MEMBER_NOT_FOUND_PARAM = "organizationMember";

export const ORGANIZATION_NOT_AUTHORIZED = "Organization is not authorized";
export const ORGANIZATION_NOT_AUTHORIZED_CODE = "org.notAuthorized";
export const ORGANIZATION_NOT_AUTHORIZED_MESSAGE = "org.notAuthorized";
export const ORGANIZATION_NOT_AUTHORIZED_PARAM = "org";

export const ORGANIZATION_NOT_FOUND = "Organization not found";
export const ORGANIZATION_NOT_FOUND_CODE = "organization.notFound";
export const ORGANIZATION_NOT_FOUND_MESSAGE = "organization.notFound";
export const ORGANIZATION_NOT_FOUND_PARAM = "organization";

export const POST_NOT_FOUND = "Post not found";
export const POST_NOT_FOUND_CODE = "post.notFound";
export const POST_NOT_FOUND_MESSAGE = "post.notFound";
export const POST_NOT_FOUND_PARAM = "post";

export const REGISTRANT_ALREADY_EXIST = "Already registered for the event";
export const REGISTRANT_ALREADY_EXIST_CODE = "registrant.alreadyExist";
export const REGISTRANT_ALREADY_EXIST_MESSAGE = "registrant.alreadyExist";
export const REGISTRANT_ALREADY_EXIST_PARAM = "registrant";

export const INVALID_FILE_TYPE = {
  message: "invalid.fileType",
  code: "internalServerError",
  param: "internalServerError",
};

export const SAME_FILE_ERROR = {
  message: "The newer image is the same as the previous image in the database",
  code: "internalServerError",
  param: "internalServerError",
};

export const INTERNAL_SERVER_ERROR = {
  message: "Internal Server Error!",
  code: "internalServerError",
  param: "internalServerError",
};

export const UNAUTHENTICATED_ERROR = {
  message: "UnauthenticatedError",
  code: "user.notAuthenticated",
  param: "userAuthentication",
};

export const LENGTH_VALIDATION_ERROR = {
  message: "Error: Length must be greater than 0 and less than",
  code: "string.notValid",
  param: "stringValidation",
};

export const REGEX_VALIDATION_ERROR = {
  message: "Error: Entered value must be a valid string",
  code: "string.notValid",
  param: "stringValidation",
};

export const USER_NOT_AUTHORIZED_SUPERADMIN = {
  message: "Error: Current user must be a SUPERADMIN",
  code: "role.notValid.superadmin",
  param: "roleValidationSuperAdmin",
};

export const USER_NOT_AUTHORIZED_ADMIN = {
  message: "Error: Current user must be an ADMIN",
  code: "role.notValid.admin",
  param: "roleValidationAdmin",
};

export const USER_BLOCKING_SELF = {
  message: "Error: Current user cannot block self",
  code: "user.selfBlock",
  param: "userSelfBlock",
};

export const USER_REMOVING_SELF = {
  message:
    "Error: Current user cannot remove self, instead you can use leave Org function",
  code: "user.selfRemove",
  param: "userSelfRemove",
};

export const ADMIN_REMOVING_ADMIN = {
  message: "Error: Current admin cannot remove another admin",
  code: "admin.removeAdmin",
  param: "admin.removeAdmin",
};

export const ADMIN_REMOVING_CREATOR = {
  message: "Error: Current admin cannot remove the creator of the Org",
  code: "admin.removeCreator",
  param: "admin.removeCreator",
};

export const USER_NOT_AUTHORIZED_TO_PIN = {
  message:
    "The user must be a superadmin or an admin of the organization to pin/unpin posts",
  code: "user.notAuthorizedToPin",
  param: "user.notAuthorizedToPin",
};

export const TASK_NOT_FOUND = "Task not found";
export const TASK_NOT_FOUND_CODE = "task.notFound";
export const TASK_NOT_FOUND_MESSAGE = "task.notFound";
export const TASK_NOT_FOUND_PARAM = "task";

export const STATUS_ACTIVE = "ACTIVE";

export const URL =
  process.env.NODE_ENV === "test"
    ? "http://localhost:4000/graphql"
    : "http://calico.palisadoes.org/talawa/graphql";

export const USER_ALREADY_MEMBER = "User is already a member";
export const USER_ALREADY_MEMBER_CODE = "user.alreadyMember";
export const USER_ALREADY_MEMBER_MESSAGE = "user.alreadyMember";
export const USER_ALREADY_MEMBER_PARAM = "user";

export const USER_ALREADY_UNREGISTERED = "Already registered for the event";
export const USER_ALREADY_UNREGISTERED_CODE = "registrant.alreadyUnregistered";
export const USER_ALREADY_UNREGISTERED_MESSAGE =
  "registrant.alreadyUnregistered";
export const USER_ALREADY_UNREGISTERED_PARAM = "registrant";

export const USER_NOT_AUTHORIZED =
  "User is not authorized for performing this operation";
export const USER_NOT_AUTHORIZED_CODE = "user.notAuthorized";
export const USER_NOT_AUTHORIZED_MESSAGE = "user.notAuthorized";
export const USER_NOT_AUTHORIZED_PARAM = "user";

export const USER_NOT_FOUND = "User not found";
export const USER_NOT_FOUND_CODE = "user.notFound";
export const USER_NOT_FOUND_MESSAGE = "user.notFound";
export const USER_NOT_FOUND_PARAM = "user";

export const TRANSLATION_ALREADY_PRESENT = "Translation Already Present";
export const TRANSLATION_ALREADY_PRESENT_CODE = "translation.alreadyPresent";
export const TRANSLATION_ALREADY_PRESENT_MESSAGE = "translation.alreadyPresent";
export const TRANSLATION_ALREADY_PRESENT_PARAM = "translationAlreadyPresent";

export const INVALID_CREDENTIALS = "Invalid credentials";
export const INVALID_CREDENTIALS_CODE = "invalid.credentials";
export const INVALID_CREDENTIALS_MESSAGE = "invalid.credentials";
export const INVALID_CREDENTIALS_PARAM = "credentials";

export const INVALID_REFRESH_TOKEN = "Invalid refreshToken";
export const INVALID_REFRESH_TOKEN_CODE = "invalid.refreshToken";
export const INVALID_REFRESH_TOKEN_MESSAGE = "invalid.refreshToken";
export const INVALID_REFRESH_TOKEN_PARAM = "refreshToken";

export const USER_PROFILE_IMAGE_NOT_FOUND = "User profile image not found";
export const USER_PROFILE_IMAGE_NOT_FOUND_CODE = "user.profileImage.notFound";
export const USER_PROFILE_IMAGE_NOT_FOUND_MESSAGE =
  "user.profileImage.notFound";
export const USER_PROFILE_IMAGE_NOT_FOUND_PARAM = "userProfileImage";

export const EMAIL_ALREADY_EXISTS = "Email already exists";
export const EMAIL_ALREADY_EXISTS_CODE = "email.alreadyExists";
export const EMAIL_ALREADY_EXISTS_MESSAGE = "email.alreadyExists";
export const EMAIL_ALREADY_EXISTS_PARAM = "email";

export const BASE_URL = `http://localhost:${process.env.port || 4000}/`;

export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

export const MONGO_DB_URL = process.env.MONGO_DB_URL;

export const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

export const MAIL_USERNAME = process.env.MAIL_USERNAME;

export const MAIL_PASSWORD = process.env.MAIL_PASSWORD;

export const apiKey = process.env.apiKey;

export const appId = process.env.appId;

export const messagingSenderId = process.env.messagingSenderId;

export const projectId = process.env.projectId;

export const storageBucket = process.env.storageBucket;

export const iOSapiKey = process.env.iOSapiKey;

export const iOSappId = process.env.iOSappId;

export const iOSmessagingSenderId = process.env.iOSmessagingSenderId;

export const iOSprojectId = process.env.iOSprojectId;

export const iOSstorageBucket = process.env.iOSstorageBucket;

export const iosClientId = process.env.iosClientId;

export const iosBundleId = process.env.iosBundleId;
