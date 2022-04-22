let URL = 'http://calico.palisadoes.org/talawa/graphql';

const USER_NOT_AUTHORIZED = 'User not authorized';
const USER_NOT_AUTHORIZED_MESSAGE = 'user.notAuthorized';
const USER_NOT_AUTHORIZED_CODE = 'user.notAuthorized';
const USER_NOT_AUTHORIZED_PARAM = 'user';

const USER_NOT_FOUND = 'User not found';
const USER_NOT_FOUND_MESSAGE = 'user.notFound';
const USER_NOT_FOUND_CODE = 'user.notFound';
const USER_NOT_FOUND_PARAM = 'user';

const ORGANIZATION_NOT_FOUND = 'Organization not found';
const ORGANIZATION_NOT_FOUND_MESSAGE = 'organization.notFound';
const ORGANIZATION_NOT_FOUND_CODE = 'organization.notFound';
const ORGANIZATION_NOT_FOUND_PARAM = 'organization';

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
};
