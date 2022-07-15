require('dotenv').config(); // pull env variables from .env file

const depthLimit = require('graphql-depth-limit'); // pacakge used to limit the number of recursive calls one can do in graphQL
const { ApolloServer, PubSub } = require('apollo-server-express'); // A TypeScript GraphQL Server for Express, Koa, Hapi, Lambda, and more.
const http = require('http'); //The HTTP core module is a key module to Node.js networking.
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
const database = require('./db.js'); // provides connect and disconnect functions
const Organization = require('./lib/resolvers/Organization');
const MembershipRequest = require('./lib/resolvers/MembershipRequest'); // finds the org and user by provided id d
const DirectChat = require('./lib/resolvers/DirectChat'); // helps to find chats
const DirectChatMessage = require('./lib/resolvers/DirectChatMessage'); // helps to find chat memssages and sender and receiver objects
const { defaultLocale, supportedLocales } = require('./lib/config/app'); // to get the default locale and supported locales for the i18n
const GroupChat = require('./lib/resolvers/GroupChat'); //user creator messg org
const GroupChatMessage = require('./lib/resolvers/GroupChatMessage'); //groupChatMesssageBelonsTo sender
const Subscription = require('./lib/resolvers/Subscription');
const AuthenticationDirective = require('./lib/directives/authDirective');
const RoleAuthorizationDirective = require('./lib/directives/roleDirective');

const app = express(); // express app

app.use(requestTracing.middleware()); // adding request tracing in the project

const pubsub = new PubSub(); // from apollo express server

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
// resolvers are provided functions that gets the data for specific models
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
}); // limiting the repeat request by providing time and max no and also error message for an IP

i18n.configure({
  directory: `${__dirname}/locales`, // speicifying the root JSON folder containing the translations
  staticCatalog: {
    en: require('./locales/en.json'),
    hi: require('./locales/hi.json'),
    zh: require('./locales/zh.json'),
    sp: require('./locales/sp.json'),
    fr: require('./locales/fr.json'),
  }, // specifying path according to the language
  queryParameter: 'lang', //* Query parameter to switch locale (ie. /home?lang=ch)
  defaultLocale: defaultLocale, //! Alter a site wide default locale
  locales: supportedLocales, //  providing the list of locales that our app supports currently
  //* We are allowing the follwing options only if we are not in the production environment to avoid bugs
  autoReload: process.env.NODE_ENV !== 'production', //* boolean -   Watch for changes in json files to reload locale on updates
  updateFiles: process.env.NODE_ENV !== 'production', //* boolean -   Whether to write new locale information to disk
  syncFiles: process.env.NODE_ENV !== 'production', //* boolean -   Sync locale information across all files
});

app.use(i18n.init); // including the internationlization in project
app.use(apiLimiter); // using the apilimiter  middleware
app.use(xss()); //* using the xss middleware so that requests will be sanitized
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production' ? undefined : false,
  })
); // * using the helmet middle ware  so that we can add custom headers
app.use(mongoSanitize()); //* using mongodb sanitizer
app.use(cors()); //* using cors middleware
/*! XSS - Cross-origin resource sharing is a mechanism that allows restricted resources on a web page to be
         requested from another domain outside the domain from which the first resource was served*/
app.use(
  requestLogger(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
    {
      stream: logger.stream,
    }
  )
); // using morgan middleware in nodejs
app.use('/images', express.static(path.join(__dirname, './images'))); // adding images as a static folder in express
//To serve static files such as images, CSS files, and JavaScript files, use the express.static built-in middleware function in Express.
app.use(requestContext.middleware()); // comes from talawa-request context library

app.get('/', (req, res) =>
  res.json({
    'talawa-version': 'v1',
    status: 'healthy',
  })
);
// sending response on the root request endpoint

const httpServer = http.createServer(app); // creating an htppserever from express

const apolloServer = new ApolloServer({
  typeDefs, // providing all the graphql types that we have created
  resolvers, // providing all the resolvers we have created
  validationRules: [depthLimit(5)], // how much recrsives nesting should be allowed -upto 5 levels
  schemaDirectives: {
    auth: AuthenticationDirective,
    role: RoleAuthorizationDirective,
  }, //A directive decorates part of a GraphQL schema or operation with additional configuration.
  // Tools like Apollo Server (and Apollo Client) can read a GraphQL document's directives and perform custom logic as appropriate.
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
  }, // providing error message on wrong query
  subscriptions: {
    /*On the client, SubscriptionsClient supports adding token information to connectionParams (example) that will be sent with the first WebSocket message.
     In the server, all GraphQL subscriptions are delayed until the connection has been fully authenticated and the onConnect callback returns a truthy value.*/
    onConnect: (connection) => {
      if (!connection.authorization) {
        throw new Error('userAuthentication');
      } //not authorized
      let userId = null;
      const token = connection.authorization.split(' ')[1];
      if (token) {
        let decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        userId = decodedToken.userId;
      } //verifyting the token  from the new connction

      return {
        currentUserToken: connection,
        currentUserId: userId,
      }; // returns  current connection and userId
    },
  }, // handling JWT authenticationc
});

apolloServer.applyMiddleware({
  app,
}); // intergrating express with apollo graphql
apolloServer.installSubscriptionHandlers(httpServer); //


// console.log(ip.address());
const serverStart = async () => {
  try {
    await database.connect();
    httpServer.listen(process.env.PORT || 4000, () => {
      // logger.info(
      //   `🚀 Server ready at http://${ip.address()}:${process.env.PORT || 4000}${apolloServer.graphqlPath
      //   }`
      // );
      logger.info(
        `🚀 Subscriptions ready at ws://localhost:${process.env.PORT || 4000}${apolloServer.subscriptionsPath
        }`
      );
    });
  } catch (e) {
    logger.error('Error while connecting to database', e);
  }
};

serverStart();

