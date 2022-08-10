let URL = 'http://calico.palisadoes.org/talawa/graphql';
const USER_NOT_AUTHORIZED =
  'User is not authorized for performing this operation';
const USER_NOT_AUTHORIZED_MESSAGE = 'user.notAuthorized';
const USER_NOT_AUTHORIZED_CODE = 'user.notAuthorized';
const USER_NOT_AUTHORIZED_PARAM = 'user';

const USER_ALREADY_MEMBER = 'User is already a member';
const USER_ALREADY_MEMBER_MESSAGE = 'user.alreadyMember';
const USER_ALREADY_MEMBER_CODE = 'user.alreadyMember';
const USER_ALREADY_MEMBER_PARAM = 'user';

const MEMBERSHIP_REQUEST_NOT_FOUND = 'Membership Request not found';
const MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE = 'membershipRequest.notFound';
const MEMBERSHIP_REQUEST_NOT_FOUND_CODE = 'membershipRequest.notFound';
const MEMBERSHIP_REQUEST_NOT_FOUND_PARAM = 'membershipRequest';

const USER_NOT_FOUND = 'User not found';
const USER_NOT_FOUND_MESSAGE = 'user.notFound';
const USER_NOT_FOUND_CODE = 'user.notFound';
const USER_NOT_FOUND_PARAM = 'user';

const ORGANIZATION_NOT_FOUND = 'Organization not found';
const ORGANIZATION_NOT_FOUND_MESSAGE = 'organization.notFound';
const ORGANIZATION_NOT_FOUND_CODE = 'organization.notFound';
const ORGANIZATION_NOT_FOUND_PARAM = 'organization';

const CONNECTION_NOT_FOUND = 'Connection not found';

const ORGANIZATION_MEMBER_NOT_FOUND = "Organization's user is not a member";
const ORGANIZATION_MEMBER_NOT_FOUND_MESSAGE = 'organization.member.notFound';
const ORGANIZATION_MEMBER_NOT_FOUND_CODE = 'organization.member.notFound';
const ORGANIZATION_MEMBER_NOT_FOUND_PARAM = 'organizationMember';

const CHAT_NOT_FOUND = 'Chat not found';
const CHAT_NOT_FOUND_MESSAGE = 'chat.notFound';
const CHAT_NOT_FOUND_CODE = 'chat.notFound';
const CHAT_NOT_FOUND_PARAM = 'chat';

const EVENT_PROJECT_NOT_FOUND = 'EventProject not found';
const EVENT_PROJECT_NOT_FOUND_CODE = 'eventProject.notFound';
const EVENT_PROJECT_NOT_FOUND_MESSAGE = 'eventProject.notFound';
const EVENT_PROJECT_NOT_FOUND_PARAM = 'eventProject';

const EVENT_NOT_FOUND = 'Event not found';
const EVENT_NOT_FOUND_MESSAGE = 'event.notFound';
const EVENT_NOT_FOUND_CODE = 'event.notFound';
const EVENT_NOT_FOUND_PARAM = 'event';

const ERROR_IN_SENDING_MAIL = 'Error in sending mail';

const INVALID_OTP = 'Invalid OTP';

const REGISTRANT_ALREADY_EXIST = 'Already registered for the event';
const REGISTRANT_ALREADY_EXIST_MESSAGE = 'registrant.alreadyExist';
const REGISTRANT_ALREADY_EXIST_CODE = 'registrant.alreadyExist';
const REGISTRANT_ALREADY_EXIST_PARAM = 'registrant';

const ORGANIZATION_NOT_AUTHORIZED = 'Organization is not authorized';
const ORGANIZATION_NOT_AUTHORIZED_MESSAGE = 'org.notAuthorized';
const ORGANIZATION_NOT_AUTHORIZED_CODE = 'org.notAuthorized';
const ORGANIZATION_NOT_AUTHORIZED_PARAM = 'org';

const MEMBER_NOT_FOUND = 'Member not found';
const MEMBER_NOT_FOUND_MESSAGE = 'member.notFound';
const MEMBER_NOT_FOUND_CODE = 'member.notFound';
const MEMBER_NOT_FOUND_PARAM = 'member';

const USER_ALREADY_UNREGISTERED = 'Already registered for the event';
const USER_ALREADY_UNREGISTERED_MESSAGE = 'registrant.alreadyUnregistered';
const USER_ALREADY_UNREGISTERED_CODE = 'registrant.alreadyUnregistered';
const USER_ALREADY_UNREGISTERED_PARAM = 'registrant';

const COMMENT_NOT_FOUND = 'Comment not found';
const COMMENT_NOT_FOUND_MESSAGE = 'comment.notFound';
const COMMENT_NOT_FOUND_CODE = 'comment.notFound';
const COMMENT_NOT_FOUND_PARAM = 'comment';

const POST_NOT_FOUND = 'Post not found';
const POST_NOT_FOUND_MESSAGE = 'post.notFound';
const POST_NOT_FOUND_CODE = 'post.notFound';
const POST_NOT_FOUND_PARAM = 'post';

const DATABASE_CONNECTION_FAIL = 'Failed to connect to database';

const STATUS_ACTIVE = 'ACTIVE';

const IN_PRODUCTION = process.env.NODE_ENV === 'production';

if (process.env.NODE_ENV === 'test') {
  URL = 'http://localhost:4000/graphql';
}

module.exports = {
  STATUS_ACTIVE,

  URL,
  IN_PRODUCTION,

  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,

  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,

  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,

  CONNECTION_NOT_FOUND,

  EVENT_PROJECT_NOT_FOUND,
  EVENT_PROJECT_NOT_FOUND_CODE,
  EVENT_PROJECT_NOT_FOUND_MESSAGE,
  EVENT_PROJECT_NOT_FOUND_PARAM,

  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,

  ERROR_IN_SENDING_MAIL,

  INVALID_OTP,

  USER_ALREADY_MEMBER,
  USER_ALREADY_MEMBER_CODE,
  USER_ALREADY_MEMBER_MESSAGE,
  USER_ALREADY_MEMBER_PARAM,

  MEMBERSHIP_REQUEST_NOT_FOUND,
  MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
  MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE,
  MEMBERSHIP_REQUEST_NOT_FOUND_PARAM,

  REGISTRANT_ALREADY_EXIST,
  REGISTRANT_ALREADY_EXIST_CODE,
  REGISTRANT_ALREADY_EXIST_MESSAGE,
  REGISTRANT_ALREADY_EXIST_PARAM,

  ORGANIZATION_NOT_AUTHORIZED,
  ORGANIZATION_NOT_AUTHORIZED_MESSAGE,
  ORGANIZATION_NOT_AUTHORIZED_CODE,
  ORGANIZATION_NOT_AUTHORIZED_PARAM,

  ORGANIZATION_MEMBER_NOT_FOUND,
  ORGANIZATION_MEMBER_NOT_FOUND_MESSAGE,
  ORGANIZATION_MEMBER_NOT_FOUND_CODE,
  ORGANIZATION_MEMBER_NOT_FOUND_PARAM,

  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_CODE,
  CHAT_NOT_FOUND_PARAM,

  MEMBER_NOT_FOUND,
  MEMBER_NOT_FOUND_MESSAGE,
  MEMBER_NOT_FOUND_CODE,
  MEMBER_NOT_FOUND_PARAM,

  USER_ALREADY_UNREGISTERED,
  USER_ALREADY_UNREGISTERED_MESSAGE,
  USER_ALREADY_UNREGISTERED_CODE,
  USER_ALREADY_UNREGISTERED_PARAM,

  COMMENT_NOT_FOUND,
  COMMENT_NOT_FOUND_MESSAGE,
  COMMENT_NOT_FOUND_CODE,
  COMMENT_NOT_FOUND_PARAM,

  POST_NOT_FOUND,
  POST_NOT_FOUND_MESSAGE,
  POST_NOT_FOUND_CODE,
  POST_NOT_FOUND_PARAM,

  DATABASE_CONNECTION_FAIL,
};
