import { join } from "node:path";
// import { readFileSync } from "node:fs";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyEnv from "@fastify/env";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { type Static } from "@sinclair/typebox";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { schema as envSchema } from "./env";
import graphql from "./routes/graphql";

/**
 * This is the root fastify instance. It could be considered as the root node of a directed
 * acyclic graph(DAG) of fastify plugins.
 */
export const fastify = Fastify({
  /**
   * Maximum size in bytes of the body of any request that the server will accept. More
   * information here:- {@link https://fastify.dev/docs/latest/Reference/Server/#bodylimit}
   *
   * @privateRemarks This limit is defined on a global server context therefore it will be applied
   * to all requests to the server. This is not practical for all use cases and should instead be
   * applied on a per-route/per-module basis. For example, 50 megabytes might not be sufficient
   * for many static file transfers, similarly, 50 megabytes is too big for simple JSON requests.
   */
  bodyLimit: 52428800,
  /**
   * Start fastify server over the HTTP/2 protocol. More info here:- {@link https://fastify.dev/docs/latest/Reference/HTTP2/}
   */
  // http2: true,
  /**
   * Make the HTTP connection secure. Secure connection is neccessary for web browsers to
   * work with the HTTP/2 protocol.
   */
  // https: {
  /**
   * Fallback support for the clients still communicating over the HTTP/1 protocol.
   */
  //   allowHTTP1: true,
  //   cert: readFileSync(join(__dirname, "../cert.pem")),
  //   key: readFileSync(join(__dirname, "../key.pem")),
  // },
  /**
   * For configuring the pino logger that comes integrated with fastify. More info here:-
   * {@link https://fastify.dev/docs/latest/Reference/Logging/}
   */
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

/**
 * More info here:- {@link https://github.com/fastify/fastify-env}
 */
fastify.register(fastifyEnv, {
  /**
   * Annotates the object field on the fastify instance using which the parsed environment
   * variables can be accessed.
   *
   * @example
   * const port = fastify.env.PORT;
   */
  confKey: "env",
  /**
   * Enables dotenv package under the hood to parse files storing environment variables.
   * By default it assumes the a file named `.env` would be present in the root directory
   * of the codebase.
   */
  dotenv: true,
  schema: envSchema,
});

/**
 * Make the parsed environment variables accessible on the fastify instance type-safe.
 */
declare module "fastify" {
  interface FastifyInstance {
    env: Static<typeof envSchema>;
  }
}

/**
 * More info here:- {@link https://github.com/fastify/fastify-rate-limit}
 */
fastify.register(fastifyRateLimit, {});

/**
 * More info here:- {@link https://github.com/fastify/fastify-cors}
 */
fastify.register(fastifyCors, {});

/**
 * More info here:- {@link https://github.com/fastify/fastify-helmet}
 */
fastify.register(fastifyHelmet, {});

/**
 * AUTHORIZATION FOR STATIC FILE ACCESS NEEDED
 */

/**
 * More info here:- {@link https://github.com/fastify/fastify-static}
 */
fastify.register(fastifyStatic, {
  prefix: "/images",
  root: join(__dirname, "./../images"),
});

fastify.register(fastifyStatic, {
  /**
   * The reply decorator has already been added by the the plugin registration in the
   * previous step.
   */
  decorateReply: false,
  prefix: "/videos",
  root: join(__dirname, "./../videos"),
});

/**
 * Registers the graphql route plugin.
 */
fastify.register(graphql, {});

export default fastify;
