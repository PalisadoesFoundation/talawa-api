// import "dotenv/config"; // pull env variables from .env file
// import http from "http";
// import path from "path";
// import express from "express";
// import { ApolloServer, PubSub } from "apollo-server-express";
// import depthLimit from "graphql-depth-limit";
// import rateLimit from "express-rate-limit";
// // No type defintions available for package 'xss-clean'
// // @ts-ignore
// import xss from "xss-clean";
// import helmet from "helmet";
// import mongoSanitize from "express-mongo-sanitize";
// import jwt from "jsonwebtoken";
// import cors from "cors";
// import requestLogger from "morgan";
// import i18n from "i18n";
// import * as database from "./db";
// import { logger, requestContext, requestTracing, stream } from "./libraries";
// import { appConfig } from "./config";
// import { isAuth } from "./middleware";
// import {
//   AuthenticationDirective,
//   RoleAuthorizationDirective,
// } from "./directives";
// import { typeDefs } from "./typeDefs";
// import { resolvers } from "./resolvers";
// import type { InterfaceJwtTokenPayload } from "./utilities";
// import { ACCESS_TOKEN_SECRET, LAST_RESORT_SUPERADMIN_EMAIL } from "./constants";
// import { User } from "./models";
// import { express as voyagerMiddleware } from "graphql-voyager/middleware";
// import { generateErrorMessage } from "zod-error";
// import { getEnvIssues } from "./env";

// const app = express();

// app.use(requestTracing.middleware());

// const pubsub = new PubSub();

// const apiLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000,
//   max: 50000,
//   message: "Too many requests from this IP, please try again after 15 minutes",
// });

// i18n.configure({
//   directory: `${__dirname}/../locales`,
//   staticCatalog: {
//     en: require("../locales/en.json"),
//     hi: require("../locales/hi.json"),
//     zh: require("../locales/zh.json"),
//     sp: require("../locales/sp.json"),
//     fr: require("../locales/fr.json"),
//   },
//   queryParameter: "lang",
//   defaultLocale: appConfig.defaultLocale,
//   locales: appConfig.supportedLocales,
//   autoReload: process.env.NODE_ENV !== "production",
//   updateFiles: process.env.NODE_ENV !== "production",
//   syncFiles: process.env.NODE_ENV !== "production",
// });

// app.use(i18n.init);
// app.use(apiLimiter);
// app.use(xss());
// app.use(
//   helmet({
//     contentSecurityPolicy:
//       process.env.NODE_ENV === "production" ? undefined : false,
//   })
// );
// app.use(mongoSanitize());
// app.use(cors());
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ limit: "50mb", extended: true }));

// // Fix added to stream
// app.use(
//   requestLogger(
//     ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
//     {
//       stream: stream,
//     }
//   )
// );

// app.use("/images", express.static(path.join(__dirname, "./../images")));
// app.use(requestContext.middleware());

// if (process.env.NODE_ENV !== "production")
//   app.use("/voyager", voyagerMiddleware({ endpointUrl: "/graphql" }));

// app.get("/", (req, res) =>
//   res.json({
//     "talawa-version": "v1",
//     status: "healthy",
//   })
// );

// const httpServer = http.createServer(app);

// // Validating the env variables
// const issues = getEnvIssues();
// if (issues) {
//   logger.error(
//     "Invalid environment variables found in your .env file, check the errors below!"
//   );
//   console.error(
//     generateErrorMessage(issues, {
//       delimiter: { error: "\\n" },
//     })
//   );
// } else {
//   logger.info("The environment variables are valid!");
// }

// const apolloServer = new ApolloServer({
//   typeDefs,
//   resolvers,
//   validationRules: [depthLimit(5)],
//   schemaDirectives: {
//     auth: AuthenticationDirective,
//     role: RoleAuthorizationDirective,
//   },
//   context: ({ req, res, connection }): any => {
//     /**
//      * The apiRootUrl for serving static files.
//      * This is constructed by extracting the protocol and host information from the `req` object.
//      * It is passed to the context object and can be accessed by all the resolver functions.
//      * Resolver functions can use this to construct absolute URLs for serving static files.
//      * For example, http://testDomain.com/ is apiRootUrl for a server with testDomain.com as Domain Name
//      * with no SSL certificate (http://)
//      * In local environment, apiRootUrl will be http://localhost:\{port\}/
//      */
//     const apiRootUrl = `${req.protocol}://${req.get("host")}/`;
//     if (connection) {
//       return {
//         ...connection,
//         pubsub,
//         res,
//         req,
//         apiRootUrl,
//       };
//     } else {
//       return {
//         ...isAuth(req),
//         pubsub,
//         res,
//         req,
//         apiRootUrl,
//       };
//     }
//   },
//   formatError: (
//     error: any
//   ): { message: string; status: number; data: string[] } => {
//     if (!error.originalError) {
//       return error;
//     }
//     const message = error.message ?? "Something went wrong !";
//     const data = error.originalError.errors ?? [];
//     const code = error.originalError.code ?? 422;
//     logger.error(message, error);
//     return {
//       message,
//       status: code,
//       data,
//     };
//   },
//   subscriptions: {
//     onConnect: (
//       connection: any
//     ): { currentUserToken: any; currentUserId: string | null } => {
//       if (!connection.authorization) {
//         throw new Error("userAuthentication");
//       }
//       let userId = null;

//       const token = connection.authorization.split(" ")[1];
//       if (token) {
//         const decodedToken = jwt.verify(
//           token,
//           ACCESS_TOKEN_SECRET as string
//         ) as InterfaceJwtTokenPayload;
//         userId = decodedToken.userId;
//       }

//       return {
//         currentUserToken: connection,
//         currentUserId: userId,
//       };
//     },
//   },
// });

// apolloServer.applyMiddleware({
//   app,
// });
// apolloServer.installSubscriptionHandlers(httpServer);

// const logWarningForSuperAdminEnvVariable = async (): Promise<void> => {
//   const superAdminExist = await User.exists({ userType: "SUPERADMIN" });
//   const isVariablePresentInEnvFile = !!LAST_RESORT_SUPERADMIN_EMAIL;
//   if (superAdminExist) {
//     if (isVariablePresentInEnvFile) {
//       logger.warn(
//         "\x1b[1m\x1b[33m%s\x1b[0m",
//         "The LAST_RESORT_SUPERADMIN_EMAIL variable configured in your .env file poses a security risk. We strongly recommend that you remove it if not required. Please refer to the documentation in the INSTALLATION.md file.You have created super admin, please remove the LAST_RESORT_SUPERADMIN_EMAIL variable from .env file if you don't require it"
//       );
//     }
//   } else {
//     if (!isVariablePresentInEnvFile) {
//       logger.warn(
//         "\x1b[1m\x1b[33m%s\x1b[0m",
//         "To create your first Super Admin, the LAST_RESORT_SUPERADMIN_EMAIL parameter needs to be set in the .env file. Please refer to the documentation in the INSTALLATION.md file."
//       );
//     }
//   }
// };

// const serverStart = async (): Promise<void> => {
//   try {
//     await database.connect();
//     httpServer.listen(process.env.PORT || 4000, async () => {
//       await logWarningForSuperAdminEnvVariable();
//       logger.info(
//         "\x1b[1m\x1b[32m%s\x1b[0m",
//         `🚀 Server ready at http://localhost:${process.env.PORT || 4000}${
//           apolloServer.graphqlPath
//         }`
//       );
//       logger.info(
//         "\x1b[1m\x1b[32m%s\x1b[0m",
//         `🚀 Subscriptions ready at ws://localhost:${process.env.PORT || 4000}${
//           apolloServer.subscriptionsPath
//         }`
//       );
//       if (process.env.NODE_ENV !== "production")
//         logger.info(
//           "\x1b[1m\x1b[32m%s\x1b[0m",
//           `🚀 Visualise the schema at http://localhost:${
//             process.env.PORT || 4000
//           }/voyager`
//         );
//     });
//   } catch (error) {
//     logger.error("Error while connecting to database", error);
//   }
// };

// serverStart();
