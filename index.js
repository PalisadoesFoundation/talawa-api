require('dotenv').config(); // pull env variables from .env file

const { ApolloServer, PubSub } = require('apollo-server-express');
const http = require('http');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const logger = require('logger');
const requestLogger = require('morgan');
const path = require('path');
const i18n = require('i18n');
const requestContext = require('talawa-request-context');
const { UnauthenticatedError } = require('errors');
const requestTracing = require('request-tracing');

const Query = require('./resolvers/Query');
const Mutation = require('./resolvers/Mutation');
const typeDefs = require('./schema/schema.graphql');
const isAuth = require('./middleware/is-auth');
const User = require('./resolvers/User');
const database = require('./db.js');
const Organization = require('./resolvers/Organization');
const MembershipRequest = require('./resolvers/MembershipRequest');
const DirectChat = require('./resolvers/DirectChat');
const DirectChatMessage = require('./resolvers/DirectChatMessage');
const { defaultLocale, supportedLocales } = require('./config/app');
const GroupChat = require('./resolvers/GroupChat');
const GroupChatMessage = require('./resolvers/GroupChatMessage');
const Subscription = require('./resolvers/Subscription');

const app = express();

app.use(requestTracing.middleware());

const pubsub = new PubSub();

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

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

i18n.configure({
  directory: `${__dirname}/locales`,
  staticCatalog: {
    en: require('./locales/en.json'),
    hi: require('./locales/hi.json'),
    zh: require('./locales/zh.json'),
    sp: require('./locales/sp.json'),
    fr: require('./locales/fr.json'),
  },
  queryParameter: 'lang',
  defaultLocale: defaultLocale,
  locales: supportedLocales,
  autoReload: process.env.NODE_ENV !== 'production',
  updateFiles: process.env.NODE_ENV !== 'production',
  syncFiles: process.env.NODE_ENV !== 'production',
});

app.use(i18n.init);
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
app.use(
  requestLogger(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
    { stream: logger.stream }
  )
);
app.use('/images', express.static(path.join(__dirname, './images')));
app.use(requestContext.middleware());

app.get('/', (req, res) =>
  res.json({ 'talawa-version': 'v1', status: 'healthy' })
);

const httpServer = http.createServer(app);

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res, connection }) => {
    if (connection) {
      return { ...connection, pubsub, res, req };
    } else {
      return { ...isAuth(req), pubsub, res, req };
    }
  },
  formatError: (err) => {
    if (!err.originalError) {
      return err;
    }
    const message = err.message || 'Something went wrong !';
    const data = err.originalError.errors || [];
    const code = err.originalError.code || 422;
    logger.error(message, err);
    return { message, status: code, data };
  },
  subscriptions: {
    onConnect: (connection) => {
      if (!connection.authToken) {
        throw new UnauthenticatedError(
          requestContext.translate('user.notAuthenticated'),
          'user.notAuthenticated',
          'userAuthentication'
        );
      }
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
      logger.info(
        `🚀 Server ready at http://localhost:${process.env.PORT || 4000}${
          apolloServer.graphqlPath
        }`
      );
      logger.info(
        `🚀 Subscriptions ready at ws://localhost:${process.env.PORT || 4000}${
          apolloServer.subscriptionsPath
        }`
      );
    });
  })
  .catch((e) => logger.error('Error while connecting to database', e));
