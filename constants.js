let URL = 'http://calico.palisadoes.org/talawa/graphql';

const USER_NOT_AUTHORIZED = 'User not authorized';
const USER_NOT_AUTHORIZED_MESSAGE = 'user.notAuthorized';
const USER_NOT_AUTHORIZED_CODE = 'user.notAuthorized';
const USER_NOT_AUTHORIZED_PARAM = 'user';

const USER_ALREADY_MEMBER = 'User already member';
const USER_ALREADY_MEMBER_MESSAGE = 'user.alreadyMember';
const USER_ALREADY_MEMBER_CODE = 'user.alreadyMember';
const USER_ALREADY_MEMBER_PARAM = 'userAlreadyMember';

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

const EVENT_NOT_FOUND = 'Event not found';
const EVENT_NOT_FOUND_MESSAGE = 'event.notFound';
const EVENT_NOT_FOUND_CODE = 'event.notFound';
const EVENT_NOT_FOUND_PARAM = 'event';

const USER_ALREADY_UNREGISTERED = 'Already registered for the event';
const USER_ALREADY_UNREGISTERED_MESSAGE = 'registrant.alreadyUnregistered';
const USER_ALREADY_UNREGISTERED_CODE = 'registrant.alreadyUnregistered';
const USER_ALREADY_UNREGISTERED_PARAM = 'registrant';

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

  USER_ALREADY_UNREGISTERED,
  USER_ALREADY_UNREGISTERED_MESSAGE,
  USER_ALREADY_UNREGISTERED_CODE,
  USER_ALREADY_UNREGISTERED_PARAM,
};
