export const URL =
  process.env.NODE_ENV === 'test'
    ? 'http://localhost:4000/graphql'
    : 'http://calico.palisadoes.org/talawa/graphql';

export const USER_NOT_AUTHORIZED =
  'User is not authorized for performing this operation';
export const USER_NOT_AUTHORIZED_MESSAGE = 'user.notAuthorized';
export const USER_NOT_AUTHORIZED_CODE = 'user.notAuthorized';
export const USER_NOT_AUTHORIZED_PARAM = 'user';

export const USER_ALREADY_MEMBER = 'User is already a member';
export const USER_ALREADY_MEMBER_MESSAGE = 'user.alreadyMember';
export const USER_ALREADY_MEMBER_CODE = 'user.alreadyMember';
export const USER_ALREADY_MEMBER_PARAM = 'user';

export const MEMBERSHIP_REQUEST_NOT_FOUND = 'Membership Request not found';
export const MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE =
  'membershipRequest.notFound';
export const MEMBERSHIP_REQUEST_NOT_FOUND_CODE = 'membershipRequest.notFound';
export const MEMBERSHIP_REQUEST_NOT_FOUND_PARAM = 'membershipRequest';

export const USER_NOT_FOUND = 'User not found';
export const USER_NOT_FOUND_MESSAGE = 'user.notFound';
export const USER_NOT_FOUND_CODE = 'user.notFound';
export const USER_NOT_FOUND_PARAM = 'user';

export const ORGANIZATION_NOT_FOUND = 'Organization not found';
export const ORGANIZATION_NOT_FOUND_MESSAGE = 'organization.notFound';
export const ORGANIZATION_NOT_FOUND_CODE = 'organization.notFound';
export const ORGANIZATION_NOT_FOUND_PARAM = 'organization';

export const ORGANIZATION_MEMBER_NOT_FOUND =
  "Organization's user is not a member";
export const ORGANIZATION_MEMBER_NOT_FOUND_MESSAGE =
  'organization.member.notFound';
export const ORGANIZATION_MEMBER_NOT_FOUND_CODE =
  'organization.member.notFound';
export const ORGANIZATION_MEMBER_NOT_FOUND_PARAM = 'organizationMember';

export const CHAT_NOT_FOUND = 'Chat not found';
export const CHAT_NOT_FOUND_MESSAGE = 'chat.notFound';
export const CHAT_NOT_FOUND_CODE = 'chat.notFound';
export const CHAT_NOT_FOUND_PARAM = 'chat';

export const EVENT_PROJECT_NOT_FOUND = 'EventProject not found';
export const EVENT_PROJECT_NOT_FOUND_CODE = 'eventProject.notFound';
export const EVENT_PROJECT_NOT_FOUND_MESSAGE = 'eventProject.notFound';
export const EVENT_PROJECT_NOT_FOUND_PARAM = 'eventProject';

export const EVENT_NOT_FOUND = 'Event not found';
export const EVENT_NOT_FOUND_MESSAGE = 'event.notFound';
export const EVENT_NOT_FOUND_CODE = 'event.notFound';
export const EVENT_NOT_FOUND_PARAM = 'event';

export const REGISTRANT_ALREADY_EXIST = 'Already registered for the event';
export const REGISTRANT_ALREADY_EXIST_MESSAGE = 'registrant.alreadyExist';
export const REGISTRANT_ALREADY_EXIST_CODE = 'registrant.alreadyExist';
export const REGISTRANT_ALREADY_EXIST_PARAM = 'registrant';

export const ORGANIZATION_NOT_AUTHORIZED = 'Organization is not authorized';
export const ORGANIZATION_NOT_AUTHORIZED_MESSAGE = 'org.notAuthorized';
export const ORGANIZATION_NOT_AUTHORIZED_CODE = 'org.notAuthorized';
export const ORGANIZATION_NOT_AUTHORIZED_PARAM = 'org';

export const MEMBER_NOT_FOUND = 'Member not found';
export const MEMBER_NOT_FOUND_MESSAGE = 'member.notFound';
export const MEMBER_NOT_FOUND_CODE = 'member.notFound';
export const MEMBER_NOT_FOUND_PARAM = 'member';

export const USER_ALREADY_UNREGISTERED = 'Already registered for the event';
export const USER_ALREADY_UNREGISTERED_MESSAGE =
  'registrant.alreadyUnregistered';
export const USER_ALREADY_UNREGISTERED_CODE = 'registrant.alreadyUnregistered';
export const USER_ALREADY_UNREGISTERED_PARAM = 'registrant';

export const COMMENT_NOT_FOUND = 'Comment not found';
export const COMMENT_NOT_FOUND_MESSAGE = 'comment.notFound';
export const COMMENT_NOT_FOUND_CODE = 'comment.notFound';
export const COMMENT_NOT_FOUND_PARAM = 'comment';

export const POST_NOT_FOUND = 'Post not found';
export const POST_NOT_FOUND_MESSAGE = 'post.notFound';
export const POST_NOT_FOUND_CODE = 'post.notFound';
export const POST_NOT_FOUND_PARAM = 'post';

export const STATUS_ACTIVE = 'ACTIVE';

export const IN_PRODUCTION = process.env.NODE_ENV === 'production';

export default {
  URL,

  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,

  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,

  USER_ALREADY_MEMBER,
  USER_ALREADY_MEMBER_CODE,
  USER_ALREADY_MEMBER_MESSAGE,
  USER_ALREADY_MEMBER_PARAM,

  USER_ALREADY_UNREGISTERED,
  USER_ALREADY_UNREGISTERED_MESSAGE,
  USER_ALREADY_UNREGISTERED_CODE,
  USER_ALREADY_UNREGISTERED_PARAM,

  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,

  ORGANIZATION_NOT_AUTHORIZED,
  ORGANIZATION_NOT_AUTHORIZED_MESSAGE,
  ORGANIZATION_NOT_AUTHORIZED_CODE,
  ORGANIZATION_NOT_AUTHORIZED_PARAM,

  ORGANIZATION_MEMBER_NOT_FOUND,
  ORGANIZATION_MEMBER_NOT_FOUND_MESSAGE,
  ORGANIZATION_MEMBER_NOT_FOUND_CODE,
  ORGANIZATION_MEMBER_NOT_FOUND_PARAM,

  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,

  EVENT_PROJECT_NOT_FOUND,
  EVENT_PROJECT_NOT_FOUND_CODE,
  EVENT_PROJECT_NOT_FOUND_MESSAGE,
  EVENT_PROJECT_NOT_FOUND_PARAM,

  MEMBERSHIP_REQUEST_NOT_FOUND,
  MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
  MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE,
  MEMBERSHIP_REQUEST_NOT_FOUND_PARAM,

  MEMBER_NOT_FOUND,
  MEMBER_NOT_FOUND_MESSAGE,
  MEMBER_NOT_FOUND_CODE,
  MEMBER_NOT_FOUND_PARAM,

  REGISTRANT_ALREADY_EXIST,
  REGISTRANT_ALREADY_EXIST_CODE,
  REGISTRANT_ALREADY_EXIST_MESSAGE,
  REGISTRANT_ALREADY_EXIST_PARAM,

  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_CODE,
  CHAT_NOT_FOUND_PARAM,

  POST_NOT_FOUND,
  POST_NOT_FOUND_MESSAGE,
  POST_NOT_FOUND_CODE,
  POST_NOT_FOUND_PARAM,

  COMMENT_NOT_FOUND,
  COMMENT_NOT_FOUND_MESSAGE,
  COMMENT_NOT_FOUND_CODE,
  COMMENT_NOT_FOUND_PARAM,

  STATUS_ACTIVE,

  IN_PRODUCTION,
};
