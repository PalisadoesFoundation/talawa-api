import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginDrainHttpServer,
} from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import "dotenv/config"; // Pull all the environment variables from .env file
import { typeDefs } from "./typeDefs";
import { resolvers } from "./resolvers";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { isAuth } from "./middleware";
import * as database from "./db";
import http from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";
import { app } from "./app";
import { logIssues } from "./checks";
import depthLimit from "graphql-depth-limit";
import authDirectiveTransformer from "./directives/directiveTransformer/authDirectiveTransformer";
import roleDirectiveTransformer from "./directives/directiveTransformer/roleDirectiveTransformer";

const pubsub = new PubSub();

// defines schema
let schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
// defines directives
schema = authDirectiveTransformer(schema, "auth");
schema = roleDirectiveTransformer(schema, "role");

// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer, enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

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
        pubsub,
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
  validationRules: [depthLimit(5)],
  csrfPrevention: true,
  cache: "bounded",
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({ embed: true }),

    /* Commenting this out since not decided which landing page plugin to use*/

    // process.env.NODE_ENV === "production"
    //   ? ApolloServerPluginLandingPageDisabled()
    //   : ApolloServerPluginLandingPageGraphQLPlayground(),
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

// Creating the WebSocket server
const wsServer = new WebSocketServer({
  // This is the `httpServer` we created in a previous step.
  server: httpServer,
  // Path of Apollo server in http server
  path: "/graphql",
});

// Hand in the schema we just created and have the
// WebSocketServer start listening.
const serverCleanup = useServer({ schema }, wsServer);

async function startServer(): Promise<void> {
  await database.connect();

  await server.start();
  server.applyMiddleware({
    app,
    path: "/graphql",
  });

  // Modified server startup
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );

  // Log all the configuration related issues
  await logIssues();

  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startServer();
