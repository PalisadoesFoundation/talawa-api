import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { makeExecutableSchema } from "@graphql-tools/schema";
import "dotenv/config"; // Pull all the environment variables from .env file
import fs from "fs";
import type { GraphQLFormattedError } from "graphql";
import depthLimit from "graphql-depth-limit";
import { PubSub } from "graphql-subscriptions";
import { useServer } from "graphql-ws/lib/use/ws";
import http from "http";
import https from "https";
import path from "path";
const dirname: string = path.dirname(new URL(import.meta.url).pathname);
import { WebSocketServer } from "ws";
import app from "./app";
import { logIssues } from "./checks";
import loadPlugins from "./config/plugins/loadPlugins";
import * as database from "./db";
import authDirectiveTransformer from "./directives/directiveTransformer/authDirectiveTransformer";
import roleDirectiveTransformer from "./directives/directiveTransformer/roleDirectiveTransformer";
import { logger } from "./libraries";
import { isAuth } from "./middleware";
import { composedResolvers } from "./resolvers";
import { typeDefs } from "./typeDefs";
import { SERVER_PORT } from "./constants";
export const pubsub = new PubSub();

// defines schema
let schema = makeExecutableSchema({
  typeDefs,
  resolvers: composedResolvers,
});

// Defines directives
schema = authDirectiveTransformer(schema, "auth");
schema = roleDirectiveTransformer(schema, "role");

// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer, enabling our servers to shut down gracefully.

const httpServer =
  process.env.NODE_ENV === "production"
    ? https.createServer(
        {
          key: fs.readFileSync(path.join(dirname, "../certs/key.pem")),
          cert: fs.readFileSync(path.join(dirname, "../certs/cert.pem")),
        },
        // :{}
        app,
      )
    : http.createServer(app);

const server = new ApolloServer({
  schema,
  introspection: true,
  formatError: (
    error: GraphQLFormattedError,
  ): { message: string; status: number; data: string[] } => {
    const message = error.message ?? "Something went wrong !";

    const data: string[] = (error.extensions?.errors as string[]) ?? [];
    const code: number = (error.extensions?.code as number) ?? 422;

    logger.error(message, error);
    return {
      message,
      status: code,
      data,
    };
  },
  validationRules: [depthLimit(6)],
  csrfPrevention: true,
  cache: "bounded",
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart(): Promise<{ drainServer(): Promise<void> }> {
        return {
          async drainServer(): Promise<void> {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { schema, context: (_ctx, _msg, _args) => ({ pubsub }) },
  wsServer,
);
let serverHost = "localhost";

async function startServer(): Promise<void> {
  await database.connect();

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        serverHost = req.get("host") || "localhost";
        return {
          ...isAuth(req),
          req,
          res,
          pubsub,
          apiRootUrl: `${req.protocol}://${serverHost}/`,
        };
      },
    }),
  );

  // Modified server startup
  const PORT = parseInt(SERVER_PORT || "4000", 10);
  if (Number.isNaN(PORT) || PORT < 0 || PORT > 65535) {
    throw new Error(
      `Invalid SERVER_PORT: ${process.env.SERVER_PORT}. Please ensure it is a numeric value between 0 and 65535.`,
    );
  }

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve),
  );

  // Log all the configuration related issues
  await logIssues();

  logger.info(
    `🚀 Server ready at ${process.env.NODE_ENV === "production" ? "https" : "http"}://${serverHost}:${PORT}/graphql`,
  );
  logger.info(
    `🚀 Subscription endpoint ready at ws://${serverHost}:${PORT}/graphql`,
  );
}

startServer();
loadPlugins();
