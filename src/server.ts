import "dotenv/config"; // pull env variables from .env file
import http from "http";
import path from "path";
import express from "express";
import { ApolloServer, PubSub } from "apollo-server-express";
import depthLimit from "graphql-depth-limit";
import rateLimit from "express-rate-limit";
// No type defintions available for package 'xss-clean'
// @ts-ignore
import xss from "xss-clean";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import jwt from "jsonwebtoken";
import cors from "cors";
import requestLogger from "morgan";
import i18n from "i18n";
import * as database from "./db";
import { logger, requestContext, requestTracing } from "./libraries";
import { appConfig } from "./config";
import { isAuth } from "./middleware";
import {
  AuthenticationDirective,
  RoleAuthorizationDirective,
} from "./directives";
import { typeDefs } from "./typeDefs";
import { resolvers } from "./resolvers";
import { Interface_JwtTokenPayload } from "./utilities";
import { ACCESS_TOKEN_SECRET } from "./constants";

const app = express();

app.use(requestTracing.middleware());

const pubsub = new PubSub();

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50000,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

i18n.configure({
  directory: `${__dirname}/../locales`,
  staticCatalog: {
    en: require("../locales/en.json"),
    hi: require("../locales/hi.json"),
    zh: require("../locales/zh.json"),
    sp: require("../locales/sp.json"),
    fr: require("../locales/fr.json"),
  },
  queryParameter: "lang",
  defaultLocale: appConfig.defaultLocale,
  locales: appConfig.supportedLocales,
  autoReload: process.env.NODE_ENV !== "production",
  updateFiles: process.env.NODE_ENV !== "production",
  syncFiles: process.env.NODE_ENV !== "production",
});

app.use(i18n.init);
app.use(apiLimiter);
app.use(xss());
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
  })
);
app.use(mongoSanitize());
app.use(cors());

// Invalid code. Needs fix.
app.use(
  requestLogger(
    // @ts-ignore
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
    {
      stream: logger.stream,
    }
  )
);
app.use("/images", express.static(path.join(__dirname, "./images")));
app.use(requestContext.middleware());

app.get("/", (req, res) =>
  res.json({
    "talawa-version": "v1",
    status: "healthy",
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
  formatError: (error: any) => {
    if (!error.originalError) {
      return error;
    }
    const message = error.message || "Something went wrong !";
    const data = error.originalError.errors || [];
    const code = error.originalError.code || 422;
    logger.error(message, error);
    return {
      message,
      status: code,
      data,
    };
  },
  subscriptions: {
    onConnect: (connection: any) => {
      if (!connection.authorization) {
        throw new Error("userAuthentication");
      }
      let userId = null;

      const token = connection.authorization.split(" ")[1];
      if (token) {
        const decodedToken = jwt.verify(
          token,
          ACCESS_TOKEN_SECRET as string
        ) as Interface_JwtTokenPayload;
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
  } catch (error) {
    logger.error("Error while connecting to database", error);
  }
};

serverStart();
