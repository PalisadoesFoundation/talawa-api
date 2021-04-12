require('dotenv').config(); // pull env variables from .env file

const { ApolloServer, PubSub } = require('apollo-server-express');
const chalk = require('chalk');
const { graphqlUploadExpress, GraphQLUpload } = require('graphql-upload');
const Query = require('./resolvers/Query');
const Mutation = require('./resolvers/Mutation');
const typeDefs = require('./schema/schema.graphql');
const isAuth = require('./middleware/is-auth');
const User = require('./resolvers/User');
const express = require('express');
const database = require('./db.js');
const Organization = require('./resolvers/Organization');
const cors = require('cors');
const MembershipRequest = require('./resolvers/MembershipRequest');
const app = express();
const path = require('path');
const DirectChat = require('./resolvers/DirectChat');
const DirectChatMessage = require('./resolvers/DirectChatMessage');

const GroupChat = require('./resolvers/GroupChat');
const GroupChatMessage = require('./resolvers/GroupChatMessage');

const Subscription = require('./resolvers/Subscription');
const jwt = require('jsonwebtoken');

const pubsub = new PubSub();
const http = require('http');

const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
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

app.use(apiLimiter);
app.use(xss());
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production' ? undefined : false,
  })
);
app.use(mongoSanitize());
app.use(cors());
app.use(graphqlUploadExpress());
app.use('/images', express.static(path.join(__dirname, './images')));

app.get('/', (req, res) =>
  res.json({ 'talawa-version': 'v1', status: 'healthy' })
);

const httpServer = http.createServer(app);

const apolloServer = new ApolloServer({
  typeDefs,
  uploads: false,
  resolvers: {
    ...resolvers,
    Upload: GraphQLUpload,
  },
  context: ({ req, res, connection }) => {
    if (connection) {
      return { ...connection, pubsub, res, req };
    } else {
      return { ...isAuth(req), pubsub, res, req };
    }
  },
  subscriptions: {
    onConnect: (connection) => {
      if (!connection.authToken) throw new Error('User is not authenticated');

      let userId = null;
      if (connection.authToken) {
        let decodedToken = jwt.verify(
          connection.authToken,
          process.env.ACCESS_TOKEN_SECRET
        );
        userId = decodedToken.userId;
      }

      return {
        currentUserToken: connection,
        currentUserId: userId,
      };
    },
  },
});

apolloServer.applyMiddleware({ app });
apolloServer.installSubscriptionHandlers(httpServer);

database
  .connect()
  .then(() => {
    // Use native http server to allow subscriptions
    httpServer.listen(process.env.PORT || 4000, () => {
      console.log(
        chalk
          .hex('#fab95b')
          .bold(
            `🚀 Server ready at http://localhost:${process.env.PORT || 4000}${
              apolloServer.graphqlPath
            }`
          )
      );
      console.log(
        chalk
          .hex('#fab95b')
          .bold(
            `🚀 Subscriptions ready at ws://localhost:${
              process.env.PORT || 4000
            }${apolloServer.subscriptionsPath}`
          )
      );
    });
  })
  .catch((e) => console.log(chalk.red(e)));
