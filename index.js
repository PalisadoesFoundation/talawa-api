require("dotenv").config(); // pull env variables from .env file

const { ApolloServer, gql, PubSub } = require("apollo-server-express");
const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");
const typeDefs = require("./schema/schema.graphql");
const isAuth = require("./middleware/is-auth");
const User = require("./resolvers/User");
const express = require("express");
const connect = require("./db.js");
const Organization = require("./resolvers/Organization");
const cors = require("cors");
const MembershipRequest = require("./resolvers/MembershipRequest");
const app = express();
const path = require("path");
const DirectChat = require("./resolvers/DirectChat");
const DirectChatMessage = require("./resolvers/DirectChatMessage");

const GroupChat = require("./resolvers/GroupChat");
const GroupChatMessage = require("./resolvers/GroupChatMessage");

const Subscription = require("./resolvers/Subscription");
const jwt = require("jsonwebtoken");

const pubsub = new PubSub();
const http = require("http");

const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  max: 500, // this can be edited in between
  message: "Too many requests from this IP, please try again after 15 minutes",
});

const resolvers = {
  Subscription,
  Query,
  Mutation,
  User,
  Organization,
  MembershipRequest,
  DirectChat,
  DirectChatMessage,
  GroupChat,
  GroupChatMessage,
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // context: ({ req }) => {
  //   return isAuth(req);
  // },
  context: ({ req, res, connection }) => {
    if (connection) {
      // if its connected using subscriptions
      return { ...connection, pubsub, res, req };
    } else {
      return { ...isAuth(req), pubsub, res, req };
    }
  },
  subscriptions: {
    onConnect: (connection, webSocket) => {
      if (!connection.authToken) throw new Error("User is not authenticated");

      let userId = null;
      if (connection.authToken) {
        let decodedToken = jwt.verify(
          connection.authToken,
          process.env.ACCESS_TOKEN_SECRET
        );
        //console.log(decodedToken);
        userId = decodedToken.userId;
        //console.log(userId);
      }

      return {
        currentUserToken: connection,
        currentUserId: userId,
      };
    },
  },
});

app.use(apiLimiter); //safety against DOS attack

app.use(xss()); //safety against XSS attack or Cross Site Scripting attacks

// app.use(helmet());//safety against XSS attack

app.use(mongoSanitize()); //safety against NoSql Injections

//makes folder available public
app.use("/images", express.static(path.join(__dirname, "./images")));

app.use(cors());

//app.use(express.static("doc"));'

server.applyMiddleware({ app });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

connect
  .then(() => {
    // app.listen({ port: process.env.PORT || 4000 }, () =>
    //   console.log(
    //     `🚀 Server ready at http://localhost:4000${server.graphqlPath}`
    //   )
    // );

    //THIS SERVER ALLOWS US TO USE SUBSCRIPTIONS

    // ⚠️ Pay attention to the fact that we are calling `listen` on the http server variable, and not on `app`.
    httpServer.listen(process.env.PORT || 8000, () => {
      console.log(
        `🚀 Server ready at http://localhost:${process.env.PORT || 8000}${
          server.graphqlPath
        }`
      );
      console.log(
        `🚀 Subscriptions ready at ws://localhost:${process.env.PORT || 8000}${
          server.subscriptionsPath
        }`
      );
    });
  })
  .catch((e) => console.log(e));
