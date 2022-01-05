let URL = 'https://talawa-graphql-api.herokuapp.com/graphql';

if (process.env.NODE_ENV === 'test') {
  URL = 'http://localhost:4000/graphql';
}

module.exports.URL = URL;
