require('dotenv').config(); // pull env variables from .env file

const depthLimit = require('graphql-depth-limit');// pacakge used to limit the number of recursive calls one can do in graphQL
const { ApolloServer, PubSub } = require('apollo-server-express'); // A TypeScript GraphQL Server for Express, Koa, Hapi, Lambda, and more.
const http = require('http');  //The HTTP core module is a key module to Node.js networking.
const rateLimit = require('express-rate-limit'); // Use to limit repeated requests to public APIs and/or endpoints such as password reset. Plays nice with express-slow-down --  Basic rate-limiting middleware for Express that slows down responses rather than blocking them 
const xss = require('xss-clean'); // to sanitize user input coming from POST body, GET queries, and url param
const helmet = require('helmet'); //Helmet helps you secure your Express apps by setting various HTTP headers
const mongoSanitize = require('express-mongo-sanitize'); //Express 4.x middleware which sanitizes user-supplied data to prevent MongoDB Operator Injection
const jwt = require('jsonwebtoken'); //An implementation of JSON Web Tokens.
const express = require('express'); // world famous nodejs server
const cors = require('cors'); // CORS is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.
const logger = require('logger'); //A simple logging library that combines the simple APIs of Ruby's logger.rb and browser-js console.log()
const requestLogger = require('morgan'); //HTTP request logger middleware for node.js
const path = require('path'); // to handle file paths 
const i18n = require('i18n'); // Lightweight simple translation module with dynamic JSON storage stored at the 'locales' folder
const requestContext = require('talawa-request-context'); // not sure
const requestTracing = require('request-tracing'); //   NOT SURE:  probably used to trace the incoming request
// GETTING THE GRAPHQL QUERIES AND MUTATIONS THESE ONE FILES EXPORT EVERY QUERY AND MUTATION
const Query = require('./lib/resolvers/Query');
const Mutation = require('./lib/resolvers/Mutation');
// IMPORTS ALL THE GRAPHQL SCHEMA AND TYPE DEFINITIONS
const typeDefs = require('./lib/schema/schema.graphql');
//JWT function
const isAuth = require('./lib/middleware/is-auth');
//database file 
const database = require('./db.js');  // provides connect and disconnect functions 
const Organization = require('./lib/resolvers/Organization');
const MembershipRequest = require('./lib/resolvers/MembershipRequest');  // finds the org and user by provided id d
const DirectChat = require('./lib/resolvers/DirectChat'); // helps to find chats 
const DirectChatMessage = require('./lib/resolvers/DirectChatMessage');// helps to find chat memssages and sender and receiver objects
const { defaultLocale, supportedLocales } = require('./lib/config/app'); // to get the default locale and supported locales for the i18n
const GroupChat = require('./lib/resolvers/GroupChat'); //user creator messg org 
const GroupChatMessage = require('./lib/resolvers/GroupChatMessage'); //groupChatMesssageBelonsTo sender
const Subscription = require('./lib/resolvers/Subscription');
const AuthenticationDirective = require('./lib/directives/authDirective');
const RoleAuthorizationDirective = require('./lib/directives/roleDirective');

const app = express();

app.use(requestTracing.middleware());

const pubsub = new PubSub();

const resolvers = {
  Subscription: Subscription,
  Query,
  Mutation,
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
    {
      stream: logger.stream,
    }
  )
);
app.use('/images', express.static(path.join(__dirname, './images')));
app.use(requestContext.middleware());

app.get('/', (req, res) =>
  res.json({
    'talawa-version': 'v1',
    status: 'healthy',
  })
);

const httpServer = http.createServer(app);

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(5)],
  schemaDirectives: {
    auth: AuthenticationDirective,
    role: RoleAuthorizationDirective,
  },
  context: ({ req, res, connection }) => {
    if (connection) {
      return {
        ...connection,
        pubsub,
        res,
        req,
      };
    } else {
      return {
        ...isAuth(req),
        pubsub,
        res,
        req,
      };
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
    return {
      message,
      status: code,
      data,
    };
  },
  subscriptions: {
    onConnect: (connection) => {
      if (!connection.authorization) {
        throw new Error('userAuthentication');
      }
      let userId = null;
      const token = connection.authorization.split(' ')[1];
      if (token) {
        let decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        userId = decodedToken.userId;
      }

      return {
        currentUserToken: connection,
        currentUserId: userId,
      };
    },
  },
});

apolloServer.applyMiddleware({
  app,
});
apolloServer.installSubscriptionHandlers(httpServer);

const serverStart = async () => {
  try {
    await database.connect();
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
  } catch (e) {
    logger.error('Error while connecting to database', e);
  }
};

serverStart();
