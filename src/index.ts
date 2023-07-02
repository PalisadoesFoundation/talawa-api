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
import { logger } from "./libraries";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from "@apollo/server/express4";

const pubsub = new PubSub();

// defines schema
let schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
// Defines directives
schema = authDirectiveTransformer(schema, "auth");
schema = roleDirectiveTransformer(schema, "role");

// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer, enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

const server = new ApolloServer({
  schema,
  formatError: (
    error: any
  ): { message: string; status: number; data: string[] } => {
    if (!error.originalError) {
      return error;
    }
    const message = error.message ?? "Something went wrong !";
    const data = error.originalError.errors ?? [];
    const code = error.originalError.code ?? 422;
    logger.error(message, error);
    return {
      message,
      status: code,
      data,
    };
  },
  validationRules: [depthLimit(5)],
  csrfPrevention: true,
  cache: "bounded",
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({ embed: true }),
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
const serverCleanup = useServer(
  { schema, context: (ctx, _msg, _args) => ({ pubsub }) },
  wsServer
);

async function startServer(): Promise<void> {
  await database.connect();

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }) => ({
        ...isAuth(req),
        req,
        res,
        pubsub,
        apiRootUrl: `${req.protocol}://${req.get("host")}/`,
      }),
    })
  );

  // Modified server startup
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );

  // Log all the configuration related issues
  await logIssues();

  console.log(`🚀 Server ready at http://localhost:4000/graphql`);
  console.log(`🚀 Subscription endpoint ready at ws://localhost:4000/graphql`);
}

startServer();
