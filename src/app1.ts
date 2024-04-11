// import cors from "cors";
import cors from "@fastify/cors";
import express from "express";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import mongoSanitize from "express-mongo-sanitize";
import fastifyFormbody from "@fastify/formbody";
// import rateLimit from "express-rate-limit";
import FastifyRateLimit from '@fastify/rate-limit';
import { express as voyagerMiddleware } from "graphql-voyager/middleware";
// import helmet from "helmet";
import helmet from "@fastify/helmet";
import i18n from "i18n";
import middie from "@fastify/middie"
import requestLogger from "morgan";
import path from "path";
import qs from "qs";
import { appConfig } from "./config";
import { requestContext, requestTracing, stream } from "./libraries";

import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
// const app = express();
const fastifyApp = Fastify({
  logger: true,
  // fastifyApp.use(express.json({ limit: "50mb" }));
  bodyLimit: 50 * 1024 * 1024 // 50mb in bytes

});

fastifyApp.register(middie);
// reigster used to register new plugins and using middie we are going to use express plugins as they are

// app.use(requestTracing.middleware());
// Register request tracing middleware
fastifyApp.addHook('onRequest', (request, reply) => {
  requestTracing.middleware();
});
// app.use(i18n.init);
// fastifyApp.addHook('onRequest', (request, reply, done) => {
//   i18n.init(request, reply, done);
// });

fastifyApp.addHook('onRequest', (request, reply) => {
  i18n.init;
});

// const apiLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000,
//   max: 50000,
//   message: "Too many requests from this IP, please try again after 15 minutes",
// });

const rateLimitOptions = {
  max: 50000, // Maximum number of requests a single client can perform inside a time window
  timeWindow: 60 * 60 * 1000, // Time window in milliseconds
  errorResponseBuilder: (request: any, context: any) => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded, retry after ' + context.after / 1000 + ' seconds',
    retryAfter: context.after / 1000 
  })
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const corsOptions: cors.CorsOptions = {
//   origin: (origin, cb) => {
//     if (process.env.NODE_ENV === "development") {
//       cb(null, true);
//       return;
//     } else if (process.env.NODE_ENV === "production") {
//       const talawaAdmin = process.env.TALAWA_ADMIN_URL;
//       if (origin === talawaAdmin) {
//         cb(null, true);
//         return;
//       }
//     }
//     cb(new Error("Unauthorized"));
//   },
// };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
fastifyApp.register(cors, {
    origin: (origin, cb) => {
    if (process.env.NODE_ENV === "development") {
    //  Request from localhost will pass
      cb(null, true);
      return;
    } else if (process.env.NODE_ENV === "production") {
      const talawaAdmin = process.env.TALAWA_ADMIN_URL;
      if (origin === talawaAdmin) {
        cb(null, true);
        return;
      }
    }
    // Generate an error on other origins, disabling access
    cb(new Error("Unauthorized"), false);
  },
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

// fastifyApp.use(apiLimiter);
// Register the rate-limit plugin
fastifyApp.register(FastifyRateLimit, rateLimitOptions);
// app.use(
//   helmet({
//     contentSecurityPolicy:
//       process.env.NODE_ENV === "production" ? undefined : false,
//   }),
// );
fastifyApp.register(
  helmet,
  {
    // Disabling the contentSecurityPolicy middleware in non-production environments
    contentSecurityPolicy: 
      process.env.NODE_ENV === "production" ? undefined : false,
  }
);
// fastifyApp.use(mongoSanitize());
fastifyApp.addHook('preHandler', (request, reply, done) => {
  mongoSanitize();
  done();
});

// app.use(cors());
// fastify.register(cors,{

// });

fastifyApp.addHook('onRequest', (request, reply, done) => {
  reply.header("Cross-Origin-Resource-Policy", "cross-origin");
  done();
});


fastifyApp.addHook('preHandler', (request, reply, done) => {
  graphqlUploadExpress();
  done();
});


// fastifyApp.use(express.urlencoded({ limit: "50mb", extended: true }));
fastifyApp.register(fastifyFormbody, {
  bodyLimit: 50 * 1024 * 1024, // 50mb in bytes
  parser: str => qs.parse(str),
});

// Fix added to stream
// fastifyApp.use(
//   requestLogger(
//     ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
//     {
//       stream: stream,
//     },
//   ),
// );

fastifyApp.addHook('preHandler', (request, reply, done) => {
  requestLogger(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
    { stream: stream }
  )(request.raw, reply.raw, done);
});

// app.use("/images", fastify.static(path.join(__dirname, "./../images")));
fastifyApp.register(fastifyStatic, {
  root: path.join(__dirname, "./../images") ,
  prefix: "/images"
});
// fastify.use("/videos", fastify.static(path.join(__dirname, "./../videos")));
fastifyApp.register(fastifyStatic, {
  root: path.join(__dirname, "./../videos"),
  prefix: "/videos"
});

// fastifyApp.use(requestContext.middleware());

fastifyApp.addHook('onRequest', (request, reply) => {
  requestContext.middleware();
});


if (process.env.NODE_ENV !== "production")
fastifyApp.addHook("onRequest", (request, reply, done) => {
  if (request.url === "/voyager") {
    voyagerMiddleware({ endpointUrl: "/graphql" })(request.raw, reply.raw);
  } else {
    done();
  }
});

fastifyApp.get("/", async (request, reply) => {
  return {
    "talawa-version": "v1",
    status: "healthy",
  };
});


export default fastifyApp;


// import { ApolloServer } from "@apollo/server";
// import { expressMiddleware } from "@apollo/server/express4";
// import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
// import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
// import { makeExecutableSchema } from "@graphql-tools/schema";
// import "dotenv/config"; // Pull all the environment variables from .env file
// import fs from "fs";
// import type { GraphQLFormattedError } from "graphql";
// import depthLimit from "graphql-depth-limit";
// import { PubSub } from "graphql-subscriptions";
// import { useServer } from "graphql-ws/lib/use/ws";
// import http from "http";
// import https from "https";
// import path from "path";
// import { WebSocketServer } from "ws";
// import app from "./app";
// import { logIssues } from "./checks";
// import loadPlugins from "./config/plugins/loadPlugins";
// import * as database from "./db";
// import authDirectiveTransformer from "./directives/directiveTransformer/authDirectiveTransformer";
// import roleDirectiveTransformer from "./directives/directiveTransformer/roleDirectiveTransformer";
// import { logger } from "./libraries";
// import { isAuth } from "./middleware";
// import { composedResolvers } from "./resolvers";
// import { typeDefs } from "./typeDefs";
// export const pubsub = new PubSub();

// // defines schema
// let schema = makeExecutableSchema({
//   typeDefs,
//   resolvers: composedResolvers,
// });

// // Defines directives
// schema = authDirectiveTransformer(schema, "auth");
// schema = roleDirectiveTransformer(schema, "role");

// // Our httpServer handles incoming requests to our Express app.
// // Below, we tell Apollo Server to "drain" this httpServer, enabling our servers to shut down gracefully.

// const httpServer =
//   process.env.NODE_ENV === "production"
//     ? https.createServer(
//         {
//           key: fs.readFileSync(path.join(__dirname, "../key.pem")),
//           cert: fs.readFileSync(path.join(__dirname, "../cert.pem")),
//         },
//         // :{}
//         app,
//       )
//     : http.createServer(app);

// const server = new ApolloServer({
//   schema,
//   formatError: (
//     error: GraphQLFormattedError,
//   ): { message: string; status: number; data: string[] } => {
//     const message = error.message ?? "Something went wrong !";

//     const data: string[] = (error.extensions?.errors as string[]) ?? [];
//     const code: number = (error.extensions?.code as number) ?? 422;

//     logger.error(message, error);
//     return {
//       message,
//       status: code,
//       data,
//     };
//   },
//   validationRules: [depthLimit(5)],
//   csrfPrevention: true,
//   cache: "bounded",
//   plugins: [
//     ApolloServerPluginLandingPageLocalDefault({ embed: true }),
//     ApolloServerPluginDrainHttpServer({ httpServer }),
//     {
//       async serverWillStart() {
//         return {
//           async drainServer() {
//             await serverCleanup.dispose();
//           },
//         };
//       },
//     },
//   ],
// });

// // Creating the WebSocket server
// const wsServer = new WebSocketServer({
//   // This is the `httpServer` we created in a previous step.
//   server: httpServer,
//   // Path of Apollo server in http server
//   path: "/graphql",
// });

// // Hand in the schema we just created and have the
// // WebSocketServer start listening.
// const serverCleanup = useServer(
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   { schema, context: (_ctx, _msg, _args) => ({ pubsub }) },
//   wsServer,
// );

// async function startServer(): Promise<void> {
//   await database.connect();

//   await server.start();

//   app.use(
//     "/graphql",
//     expressMiddleware(server, {
//       context: async ({ req, res }) => ({
//         ...isAuth(req),
//         req,
//         res,
//         pubsub,
//         apiRootUrl: `${req.protocol}://${req.get("host")}/`,
//       }),
//     }),
//   );

//   // Modified server startup
//   await new Promise<void>((resolve) =>
//     httpServer.listen({ port: 4000 }, resolve),
//   );

//   // Log all the configuration related issues
//   await logIssues();

//   logger.info(
//     `🚀 Server ready at ${
//       process.env.NODE_ENV === "production" ? "https" : "http"
//     }://localhost:4000/graphql`,
//   );
//   logger.info(`🚀 Subscription endpoint ready at ws://localhost:4000/graphql`);
// }

// startServer();
// loadPlugins();