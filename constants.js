let URL = 'http://calico.palisadoes.org/talawa/graphql';

const USER_NOT_AUTHORIZED = 'User not authorized';
const USER_NOT_FOUND = 'User not found';
const ORGANIZATION_NOT_FOUND = 'Organization not found';

if (process.env.NODE_ENV === 'test') {
  URL = 'http://localhost:4000/graphql';
}

module.exports = {
  URL,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
};
