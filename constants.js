<<<<<<< HEAD
let URL = 'http://calico.palisadoes.org/talawa/graphql';

if (process.env.NODE_ENV === 'test') {
  URL = 'http://localhost:4000/graphql';
}
=======
const URL = 'https://talawa-graphql-api.herokuapp.com/graphql';
// const URL = "http://localhost:4000/graphql";
>>>>>>> upstream/develop

module.exports.URL = URL;
