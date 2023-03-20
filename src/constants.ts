export const CHAT_NOT_FOUND_ERROR = {
  DESC: "Chat not found",
  CODE: "chat.notFound",
  MESSAGE: "chat.notFound",
  PARAM: "chat",
};
export const COMMENT_NOT_FOUND_ERROR = {
  DESC: "Comment not found",
  CODE: "comment.notFound",
  MESSAGE: "comment.notFound",
  PARAM: "comment",
};
export const ERROR_IN_SENDING_MAIL = "Error in sending mail";
export const EVENT_NOT_FOUND_ERROR = {
  DESC: "Event not found",
  CODE: "event.notFound",
  MESSAGE: "event.notFound",
  PARAM: "event",
};
export const EVENT_PROJECT_NOT_FOUND_ERROR = {
  DESC: "EventProject not found",
  CODE: "eventProject.notFound",
  MESSAGE: "eventProject.notFound",
  PARAM: "eventProject",
};
export const INVALID_OTP = "Invalid OTP";

export const IN_PRODUCTION = process.env.NODE_ENV === "production";
export const MEMBER_NOT_FOUND_ERROR = {
  DESC: "Member not found",
  CODE: "member.notFound",
  MESSAGE: "member.notFound",
  PARAM: "member",
};
export const MEMBERSHIP_REQUEST_NOT_FOUND_ERROR = {
  DESC: "Membership Request not found",
  CODE: "membershipRequest.notFound",
  MESSAGE: "membershipRequest.notFound",
  PARAM: "membershipRequest",
};
export const MEMBERSHIP_REQUEST_ALREADY_EXISTS =
  "Membership Request already exists";

export const ORGANIZATION_MEMBER_NOT_FOUND_ERROR = {
  DESC: "Organization's user is not a member",
  CODE: "organization.member.notFound",
  MESSAGE: "organization.member.notFound",
  PARAM: "organizationMember",
};
export const ORGANIZATION_NOT_AUTHORIZED_ERROR = {
  DESC: "Organization is not authorized",
  CODE: "org.notAuthorized",
  MESSAGE: "org.notAuthorized",
  PARAM: "org",
};
export const ORGANIZATION_NOT_FOUND_ERROR = {
  DESC: "Organization not found",
  CODE: "organization.notFound",
  MESSAGE: "organization.notFound",
  PARAM: "organization",
};
export const ORGANIZATION_IMAGE_NOT_FOUND_ERROR = {
  DESC: "OrganizationImage not found",
  CODE: "organizationImage.notFound",
  MESSAGE: "organizationImage.notFound",
  PARAM: "organizationImage",
};
export const POST_NOT_FOUND_ERROR = {
  DESC: "Post not found",
  CODE: "post.notFound",
  MESSAGE: "post.notFound",
  PARAM: "post",
};
export const REGISTRANT_ALREADY_EXIST_ERROR = {
  DESC: "Already registered for the event",
  CODE: "registrant.alreadyExist",
  MESSAGE: "registrant.alreadyExist",
  PARAM: "registrant",
};

export const INVALID_FILE_TYPE = {
  MESSAGE: "invalid.fileType",
  CODE: "internalServerError",
  PARAM: "internalServerError",
};

export const SAME_FILE_ERROR = {
  MESSAGE: "The newer image is the same as the previous image in the database",
  CODE: "internalServerError",
  PARAM: "internalServerError",
};

export const INTERNAL_SERVER_ERROR = {
  MESSAGE: "Internal Server Error!",
  CODE: "internalServerError",
  PARAM: "internalServerError",
};

export const UNAUTHENTICATED_ERROR = {
  MESSAGE: "UnauthenticatedError",
  CODE: "user.notAuthenticated",
  PARAM: "userAuthentication",
};

export const LENGTH_VALIDATION_ERROR = {
  MESSAGE: "Error: Length must be greater than 0 and less than",
  CODE: "string.notValid",
  PARAM: "stringValidation",
};

export const REGEX_VALIDATION_ERROR = {
  MESSAGE: "Error: Entered value must be a valid string",
  CODE: "string.notValid",
  PARAM: "stringValidation",
};

export const USER_NOT_AUTHORIZED_SUPERADMIN = {
  MESSAGE: "Error: Current user must be a SUPERADMIN",
  CODE: "role.notValid.superadmin",
  PARAM: "roleValidationSuperAdmin",
};

export const USER_NOT_AUTHORIZED_ADMIN = {
  MESSAGE: "Error: Current user must be an ADMIN or a SUPERADMIN",
  CODE: "role.notValid.admin",
  PARAM: "roleValidationAdmin",
};

export const USER_NOT_ORGANIZATION_ADMIN = {
  MESSAGE: "Error: User must be an ADMIN",
  CODE: "role.notValid.admin",
  PARAM: "roleValidationAdmin",
};

export const USER_BLOCKING_SELF = {
  MESSAGE: "Error: Current user cannot block self",
  CODE: "user.selfBlock",
  PARAM: "userSelfBlock",
};

export const USER_REMOVING_SELF = {
  MESSAGE:
    "Error: Current user cannot remove self, instead you can use leave Org function",
  CODE: "user.selfRemove",
  PARAM: "userSelfRemove",
};

export const ADMIN_REMOVING_ADMIN = {
  MESSAGE: "Error: Current admin cannot remove another admin",
  CODE: "admin.removeAdmin",
  PARAM: "admin.removeAdmin",
};

export const ADMIN_REMOVING_CREATOR = {
  MESSAGE: "Error: Current admin cannot remove the creator of the Org",
  CODE: "admin.removeCreator",
  PARAM: "admin.removeCreator",
};

export const USER_NOT_AUTHORIZED_TO_PIN = {
  MESSAGE:
    "The user must be a superadmin or an admin of the organization to pin/unpin posts",
  CODE: "user.notAuthorizedToPin",
  PARAM: "user.notAuthorizedToPin",
};

export const TAG_NOT_FOUND = {
  MESSAGE: "The tag with the specified ID doesn't exist.",
  CODE: "tag.doesNotExist",
  PARAM: "tag.doesNotExist",
};

export const USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION = {
  MESSAGE:
    "The user to which the tag is being assigned hasn't joined the tag's parent organization.",
  CODE: "user.notJoinedOrg",
  PARAM: "user.notJoinedOrg",
};

export const INVALID_TAG_INPUT = {
  MESSAGE:
    "Either an organizatin ID or a parent tag ID must be provided for this operation.",
  CODE: "invalidArgs",
  PARAM: "invalidArgs",
};

export const INCORRECT_TAG_INPUT = {
  MESSAGE: "The tag does not belong to the organization provided.",
  CODE: "invalidArgs.tag",
  PARAM: "invalidArgs.tag",
};

export const NO_CHANGE_IN_TAG_NAME = {
  MESSAGE:
    "The tag name is the already set to the value it is being requested to be changed to.",
  CODE: "invalidArgs.tagName",
  PARAM: "invalidArgs.tagName",
};

export const TAG_ALREADY_EXISTS = {
  MESSAGE:
    "A tag with the same name and the same parent tag already exists for this organization.",
  CODE: "tag.alreadyExists",
  PARAM: "tag.alreadyExists",
};

export const USER_NOT_AUTHORIZED_TO_CREATE_TAG = {
  MESSAGE:
    "The user must be a superadmin or an admin of the organization to create the tag.",
  CODE: "user.notAuth.createTag",
  PARAM: "user.notAuth.createTag",
};

export const USER_ALREADY_HAS_TAG = {
  MESSAGE:
    "The user already has the tag that it is being requested to assigned.",
  CODE: "user.alreadyHasTag",
  PARAM: "user.alreadyHasTag",
};

export const USER_DOES_NOT_HAVE_THE_TAG = {
  MESSAGE:
    "The user does not have the tag that is being requested to be removed.",
  CODE: "user.doesNotHaveTag",
  PARAM: "user.doesNotHaveTag",
};

export const TASK_NOT_FOUND_ERROR = {
  DESC: "Task not found",
  CODE: "task.notFound",
  MESSAGE: "task.notFound",
  PARAM: "task",
};

export const STATUS_ACTIVE = "ACTIVE";

export const URL =
  process.env.NODE_ENV === "test"
    ? "http://localhost:4000/graphql"
    : "http://calico.palisadoes.org/talawa/graphql";

export const USER_ALREADY_MEMBER_ERROR = {
  DESC: "User is already a member",
  CODE: "user.alreadyMember",
  MESSAGE: "user.alreadyMember",
  PARAM: "user",
};
export const USER_ALREADY_UNREGISTERED_ERROR = {
  DESC: "Already registered for the event",
  CODE: "registrant.alreadyUnregistered",
  MESSAGE: "registrant.alreadyUnregistered",
  PARAM: "registrant",
};
export const USER_NOT_AUTHORIZED_ERROR = {
  DESC: "User is not authorized for performing this operation",
  CODE: "user.notAuthorized",
  MESSAGE: "user.notAuthorized",
  PARAM: "user",
};
export const USER_NOT_FOUND_ERROR = {
  DESC: "User not found",
  CODE: "user.notFound",
  MESSAGE: "user.notFound",
  PARAM: "user",
};
export const TRANSLATION_ALREADY_PRESENT_ERROR = {
  DESC: "Translation Already Present",
  CODE: "translation.alreadyPresent",
  MESSAGE: "translation.alreadyPresent",
  PARAM: "translationAlreadyPresent",
};
export const INVALID_CREDENTIALS_ERROR = {
  DESC: "Invalid credentials",
  CODE: "invalid.credentials",
  MESSAGE: "invalid.credentials",
  PARAM: "credentials",
};
export const INVALID_REFRESH_TOKEN_ERROR = {
  DESC: "Invalid refreshToken",
  CODE: "invalid.refreshToken",
  MESSAGE: "invalid.refreshToken",
  PARAM: "refreshToken",
};
export const USER_PROFILE_IMAGE_NOT_FOUND_ERROR = {
  DESC: "User profile image not found",
  CODE: "user.profileImage.notFound",
  MESSAGE: "user.profileImage.notFound",
  PARAM: "userProfileImage",
};
export const EMAIL_ALREADY_EXISTS_ERROR = {
  DESC: "Email already exists",
  CODE: "email.alreadyExists",
  MESSAGE: "email.alreadyExists",
  PARAM: "email",
};

export const PAGINATION_EITHER_FIRST_OR_LAST_MUST_BE_PROVIDED_ERROR = {
  MESSAGE:
    "The pagination arguments must either contain a positive integer for first or last argument.",
  CODE: "pagination.firstOrLastMustExist",
  PARAM: "pagination.firstOrLastMustExist",
};

export const PAGINATION_BOTH_FIRST_AND_LAST_MUST_NOT_BE_PROVIDED_ERROR = {
  MESSAGE:
    "The pagination arguments must not contain both first and last arguments.",
  CODE: "pagination.bothFirstAndLastProvided",
  PARAM: "pagination.bothFirstAndLastProvided",
};

export const PAGINATION_BEFORE_AND_LAST_MUST_NOT_BE_PROVIDED_WITH_FIRST_ERROR =
  {
    MESSAGE:
      "The pagination arguments must not contain before or last argument if first argument is provided.",
    CODE: "pagination.noBeforeAndLastIfFirstProvided",
    PARAM: "pagination.noBeforeAndLastIfFirstProvided",
  };

export const PAGINATION_AFTER_AND_FIRST_MUST_NOT_BE_PROVIDED_WITH_LAST_ERROR = {
  MESSAGE:
    "The pagination arguments must not contain after or first argument if last argument is provided.",
  CODE: "pagination.noafterAndFirstIfLastProvided",
  PARAM: "pagination.noafterAndFirstIfLastProvided",
};

export const MAXIMUM_FETCH_LIMIT = 100;

export const PAGINATION_MAXIMUM_FETCH_LIMIT_CROSSED = {
  MESSAGE: `Atmost ${MAXIMUM_FETCH_LIMIT} items can be fetched in a single request.`,
  CODE: "pagination.maximumFetchLimitCrossed",
  PARAM: "pagination.maximumFetchLimitCrossed",
};

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

export const LAST_RESORT_SUPERADMIN_EMAIL =
  process.env.LAST_RESORT_SUPERADMIN_EMAIL;

export const SMTP_OPTIONS = {
  IS_SMTP: process.env.IS_SMTP,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_USERNAME: process.env.SMTP_USERNAME,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SSL_TLS: process.env.SMTP_SSL_TLS,
};
