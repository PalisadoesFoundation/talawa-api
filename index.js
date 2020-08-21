
require('dotenv').config() // pull env variables from .env file

const { ApolloServer, gql } = require("apollo-server-express");
const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");
const typeDefs = require("./schema/schema.graphql");
const isAuth = require("./middleware/is-auth");
const User = require("./resolvers/User");
const express = require("express");
const connect = require("./db.js");
const Organization = require("./resolvers/Organization")
const cors = require("cors");
const MembershipRequest = require("./resolvers/MembershipRequest");
const app = express();
const path = require("path")

const resolvers = {
  Query,
  Mutation,
  User,
  Organization,
  MembershipRequest
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    return isAuth(req);
  },
});
server.applyMiddleware({ app });

//makes folder available public
app.use("/images", express.static(path.join(__dirname, "./images")))


app.use(cors());

//app.use(express.static("doc"));


connect
  .then(() => {
    app.listen({ port: process.env.PORT || 80 }, () =>
      console.log(
        `🚀 Server ready at http://localhost:4000${server.graphqlPath}`
      )
    );
  })
  .catch((e) => console.log(e));
