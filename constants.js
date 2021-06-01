let URL = 'http://calico.palisadoes.org/talawa/graphql';

if (process.env.NODE_ENV === 'test') {
  URL = 'http://localhost:4000/graphql';
}

module.exports.URL = URL;
