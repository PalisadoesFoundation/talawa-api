import {
  type YogaLogger,
  createYoga,
  type YogaServerInstance,
} from "graphql-yoga";
import { type GraphQLUserContext, createContext } from "./createContext";
import { EnvelopArmor } from "@escape.tech/graphql-armor";
import { pubSub } from "./pubSub";
import type { Env } from "../../env";
import { schema } from "./schema";
// import { createFetch } from "@whatwg-node/fetch";

/**
 * Type of the initial context passed to the graphQL server by the fastify request handler.
 */
export type GraphQLServerContext = {
  apiRootUrl: string;
};

/**
 * Type of fields required by the first argument of the `createGraphQLServer` function.
 */
export type CreateGraphQLServerArgs = {
  env: Env;
  log?: YogaLogger;
};

/**
 * This function is used to create an instance of the graphQL yoga server that will be used
 * to handle all the graphQL reqeusts.
 */
export const createGraphQLServer = ({
  env,
  log,
}: CreateGraphQLServerArgs): YogaServerInstance<
  GraphQLServerContext,
  GraphQLUserContext
> => {
  /**
   * This module handles many issues related to graphQL security. More info can be found
   * here:- {@link https://escape.tech/graphql-armor/}. It has default configurations for
   * all the plugins it provides. More info can be found here:- {@link https://escape.tech/graphql-armor/docs/category/plugins}.
   * Many plugins from this package might not be needed if persisted queries are being used
   * for the communication between the graphQL clients and the server. More info can be found
   * here:- {@link https://the-guild.dev/graphql/yoga-server/docs/features/persisted-operations}
   */
  const graphQLArmor = new EnvelopArmor({
    blockFieldSuggestion: {
      /**
       * Having field suggestions in development environment is safe.
       */
      enabled: env.NODE_ENV !== "development",
    },
  });

  return createYoga<GraphQLServerContext, GraphQLUserContext>({
    context: (initialContext) => {
      /**
       * Anything requiring a lifetime longer than a single graphQL request should not be
       * defined in this function's scope.
       */
      return createContext({
        ...initialContext,
        env,
        /**
         * The publish/subscribe bus must have a global lifetime so it is not initialized
         * inside this function's scope.
         */
        pubSub,
      });
    },
    /**
     * Configuring the multipart file request processing. More information here:-
     * {@link https://the-guild.dev/graphql/yoga-server/docs/features/file-uploads#configuring-multipart-request-processing-only-for-nodejs}
     */
    // fetchAPI: createFetch({
    //   formDataLimits: {},
    // }),
    /**
     * GraphQL yoga has a built-in logger but for uniformity across logs the logger provided
     * by the fastify server is used. If `log` arugment is not provided by the caller of
     * `createGraphQLServer` function, then graphql-yoga's default logger is used.
     */
    logging:
      log === undefined
        ? true
        : {
            debug: (...args) => args.forEach((arg) => log.debug(arg)),
            info: (...args) => args.forEach((arg) => log.info(arg)),
            warn: (...args) => args.forEach((arg) => log.warn(arg)),
            error: (...args) => args.forEach((arg) => log.error(arg)),
          },
    plugins: [...graphQLArmor.protect().plugins],
    schema,
  });
};
