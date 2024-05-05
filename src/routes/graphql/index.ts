import type { FastifyPluginAsync } from "fastify";
import { format } from "node:url";
import { createGraphQLServer } from "./server";
import mongoose from "mongoose";

/**
 * This fastify plugin handles everything related to the endpoint exposed on the fastify
 * server for handling graphQL requests.
 */
export const route: FastifyPluginAsync = async (fastify) => {
  mongoose.connect(fastify.env.MONGO_DB_URI);

  /**
   * This is the global instance of the graphQL yoga server that has the same lifetime as the
   * fastify server.
   */
  const yogaServer = createGraphQLServer({
    env: fastify.env,
    log: fastify.log,
  });
  /**
   * This will allow fastify to parse the incoming file uploads done through graphQL. More
   * info here:- {@link https://github.com/fastify/fastify-multipart} {@link https://the-guild.dev/graphql/yoga-server/docs/features/file-uploads}
   */
  /**
   * This makes fastify ignore and forward requests with `multipart/form-data` bodies to the
   * graphQL server. More infor here:- {@link https://the-guild.dev/graphql/yoga-server/docs/integrations/integration-with-fastify#add-dummy-content-type-parser-for-file-uploads}
   */
  fastify.addContentTypeParser(
    "multipart/form-data",
    {},
    (_request, _payload, done) => done(null),
  );

  /**
   * The incoming HTTP request is passed to the graphQL server and the response is handled
   * using fastify's reply API. More information about the reply API here:-
   * {@link https://www.fastify.io/docs/latest/Reply/}
   **/
  fastify.route({
    handler: async (request, reply) => {
      /**
       * Anything requiring a lifetime longer than a single graphQL request should not be
       * initialized in this function's scope.
       */

      /**
       * This is a WHATWG Fetch spec compliant Response object returned from the graphQL
       * server. More information here:- {@link https://fetch.spec.whatwg.org/#responses}
       */
      const response = await yogaServer.handleNodeRequestAndResponse(
        request,
        reply,
        {
          /**
           * The is the object corresponding to the `GraphQLServerContext` type, the fields
           * passed here are merged with the field corresponding to the `YogaInitialContext`
           * type and end up as the `intialContext` argument to the `createContext` function
           * used in the definition of the `createGraphQLServer` function.
           */
          apiRootUrl: format({
            host: request.hostname,
            protocol: request.protocol,
          }),
        },
      );

      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });

      reply.status(response.status);

      reply.send(response.body);

      return reply;
    },
    /**
     * GraphQL servers only operate over HTTP methods GET and POST. The OPTIONS method is
     * required for preflight requests.
     */
    method: ["GET", "OPTIONS", "POST"],
    /**
     * Annotating the endpoint at which the graphQL server will be served on.
     */
    url: "/graphql",
  });
};

export default route;
