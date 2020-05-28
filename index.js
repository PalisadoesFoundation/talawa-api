const { ApolloServer, gql } = require("apollo-server");
const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");
const typeDefs = require("./schema.graphql");
const isAuth = require("./middleware/is-auth");
const User = require("./resolvers/User");
const express = require("express");
const connect = require("./db.js");

const app = express();

const resolvers = {
  Query,
  Mutation,
  User,
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    return isAuth(req);
  },
});

connect
  .then(() => {
    server.listen().then(({ url }) => {
      console.log(`🚀  Server ready at ${url}`);
    });
  })
  .catch((e) => console.log(e));
