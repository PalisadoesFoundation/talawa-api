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
