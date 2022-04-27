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

const MEMBERSHIP_REQUEST_NOT_FOUND = 'membership Request not found';
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

const ORGANIZATION_MEMBER_NOT_FOUND = "Organization's user is not a member";
const ORGANIZATION_MEMBER_NOT_FOUND_MESSAGE = 'organization.member.notFound';
const ORGANIZATION_MEMBER_NOT_FOUND_CODE = 'organization.member.notFound';
const ORGANIZATION_MEMBER_NOT_FOUND_PARAM = 'organizationMember';

const CHAT_NOT_FOUND = 'Chat not found';
const CHAT_NOT_FOUND_MESSAGE = 'chat.notFound';
const CHAT_NOT_FOUND_CODE = 'chat.notFound';
const CHAT_NOT_FOUND_PARAM = 'chat';

const EVENT_NOT_FOUND = 'Event not found';
const EVENT_NOT_FOUND_MESSAGE = 'event.notFound';
const EVENT_NOT_FOUND_CODE = 'event.notFound';
const EVENT_NOT_FOUND_PARAM = 'event';

const MEMBER_NOT_FOUND = 'Member not found';
const MEMBER_NOT_FOUND_MESSAGE = 'member.notFound';
const MEMBER_NOT_FOUND_CODE = 'member.notFound';
const MEMBER_NOT_FOUND_PARAM = 'member';

const IN_PRODUCTION = process.env.NODE_ENV === 'production';

if (process.env.NODE_ENV === 'test') {
  URL = 'http://localhost:4000/graphql';
}

module.exports = {
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

  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,

  USER_ALREADY_MEMBER,
  USER_ALREADY_MEMBER_CODE,
  USER_ALREADY_MEMBER_MESSAGE,
  USER_ALREADY_MEMBER_PARAM,

  MEMBERSHIP_REQUEST_NOT_FOUND,
  MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
  MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE,
  MEMBERSHIP_REQUEST_NOT_FOUND_PARAM,

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
};
