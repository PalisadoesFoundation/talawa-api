import cors from "@fastify/cors";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import mongoSanitize from "express-mongo-sanitize";
import fastifyFormbody from "@fastify/formbody";
import FastifyRateLimit from "@fastify/rate-limit";
import { express as voyagerMiddleware } from "graphql-voyager/middleware";
import helmet from "@fastify/helmet";
import i18n from "i18n";
import middie from "@fastify/middie";
import requestLogger from "morgan";
import path from "path";
import qs from "qs";
import { appConfig } from "./config";
import { requestContext,stream } from "./libraries";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";

const fastifyApp = Fastify({
  logger: true,
  bodyLimit: 50 * 1024 * 1024, // 50mb in bytes
});

fastifyApp.register(middie);

fastifyApp.addHook("onRequest", (request, reply) => {
  i18n.init;
});

const rateLimitOptions = {
  max: 50000, // Maximum number of requests a single client can perform inside a time window
  timeWindow: 60 * 60 * 1000, // Time window in milliseconds
  errorResponseBuilder: (request: any, context: any) => ({
    statusCode: 429,
    error: "Too Many Requests",
    message:
      "Rate limit exceeded, retry after " + context.after / 1000 + " seconds",
    retryAfter: context.after / 1000,
  }),
};

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

// Register the rate-limit plugin
fastifyApp.register(FastifyRateLimit, rateLimitOptions);

fastifyApp.register(helmet, {
  // Disabling the contentSecurityPolicy middleware in non-production environments
  contentSecurityPolicy:
    process.env.NODE_ENV === "production" ? undefined : false,
});

fastifyApp.addHook("preHandler", (request, reply, done) => {
  mongoSanitize();
  done();
});

fastifyApp.addHook("onRequest", (request, reply, done) => {
  reply.header("Cross-Origin-Resource-Policy", "cross-origin");
  done();
});

fastifyApp.addHook("preHandler", (request, reply, done) => {
  graphqlUploadExpress();
  done();
});

fastifyApp.register(fastifyFormbody, {
  bodyLimit: 50 * 1024 * 1024, // 50mb in bytes
  parser: (str) => qs.parse(str),
});

fastifyApp.addHook("preHandler", (request, reply, done) => {
  requestLogger(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
    { stream: stream },
  )(request.raw, reply.raw, done);
});

fastifyApp.register(fastifyStatic, {
  root: path.join(__dirname, "./../images"),
  prefix: "/images",
});

fastifyApp.register(fastifyStatic, {
  root: path.join(__dirname, "./../videos"),
  prefix: "/videos",
});

fastifyApp.addHook("onRequest", (request, reply) => {
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
