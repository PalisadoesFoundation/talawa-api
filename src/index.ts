import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginDrainHttpServer,
} from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";

import "dotenv/config"; // Pull all the environment variables from .env file
import { typeDefs } from "./typeDefs";
import { resolvers } from "./resolvers";
import {
  AuthenticationDirective,
  RoleAuthorizationDirective,
} from "./directives";
import { isAuth } from "./middleware";
import * as database from "./db";
import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import type { GraphQLField, GraphQLFieldConfig } from "graphql";
import { errors, requestContext } from "./libraries";
import express from "express";
import http from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";

// const pubsub = new PubSub();

//@ts-ignore
// function directiveTransformer(schema, directiveName) {
//   return mapSchema(schema, {
//     [MapperKind.OBJECT_FIELD]: (
//       fieldConfig: GraphQLFieldConfig<any, any>
//     ): any => {
//       // Check whether this field has the specified directive
//       const authDirective = getDirective(
//         schema,
//         fieldConfig,
//         directiveName
//       )?.[0];
//       if (authDirective) {
//         //@ts-ignore
//         const { resolve = defaultFieldResolver } = fieldConfig;

//         fieldConfig.resolve = (root, args, context, info): string => {
//           if (context.expired || !context.isAuth)
//             throw new errors.UnauthenticatedError(
//               requestContext.translate("user.notAuthenticated"),
//               "user.notAuthenticated",
//               "userAuthentication"
//             );
//           return resolve(root, args, context, info);
//         };
//         return fieldConfig;
//       }
//     },
//   });
// }

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  // schemaDirectives: {
  //   auth: AuthenticationDirective,
  //   role: RoleAuthorizationDirective,
  // },
});
// schema = directiveTransformer(schema, "auth");

const app = express();

// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer, enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

// Intializing a variable to store the subscription server
// TODO: Figure out typescript and ESLint (Prefer const) error
let subscriptionServer: SubscriptionServer | undefined;

const server = new ApolloServer({
  schema,
  context: ({
    req,
    res,
    connection,
  }: {
    req: any;
    res: any;
    connection: any;
  }): any => {
    const apiRootUrl = `${req.protocol}://${req.get("host")}/`;
    if (connection) {
      return {
        ...connection,
        // pubsub,
        res,
        req,
        apiRootUrl,
      };
    } else {
      return {
        ...isAuth(req),
        // pubsub,
        res,
        req,
        apiRootUrl,
      };
    }
  },
  csrfPrevention: true,
  cache: "bounded",
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    process.env.NODE_ENV === "production"
      ? ApolloServerPluginLandingPageDisabled()
      : ApolloServerPluginLandingPageGraphQLPlayground(),
    {
      // TODO: Fix typescript error
      async serverWillStart() {
        return {
          async drainServer(): Promise<void> {
            subscriptionServer!.close();
          },
        };
      },
    },
  ],
});

subscriptionServer = SubscriptionServer.create(
  {
    schema,
    execute,
    subscribe,
    // Return the context object for the subscription server
    onConnect() {
      // lookup userId by token, etc.
      // return { userId };
    },
  },
  {
    server: httpServer,
    path: server.graphqlPath,
  }
);

async function startServer(): Promise<void> {
  await database.connect();

  await server.start();
  server.applyMiddleware({
    app,
    path: "/",
  });

  // Modified server startup
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startServer();
