import "dotenv/config"; // Pull all the environment variables from .env file
import { typeDefs } from "./typeDefs";
import Redis from "ioredis";
import { composedResolvers } from "./resolvers";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { isAuth } from "./middleware";
import * as database from "./db";
import http from "http";
import https from "https";
import fs from "fs";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";
import app from "./app";
import { logIssues } from "./checks";
import depthLimit from "graphql-depth-limit";
import authDirectiveTransformer from "./directives/directiveTransformer/authDirectiveTransformer";
import roleDirectiveTransformer from "./directives/directiveTransformer/roleDirectiveTransformer";
import { logger } from "./libraries";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from "@apollo/server/express4";
import loadPlugins from "./config/plugins/loadPlugins";
import path from "path";
const pubsub = new PubSub();

// defines schema
let schema = makeExecutableSchema({
  typeDefs,
  resolvers: composedResolvers,
});
// Checks the connection of Redis server
const redisClient = new Redis();
redisClient.ping((err, result) => {
  if (err) {
    logger.error("Error connecting to Redis:", err);
  } else {
    logger.info("Connected to Redis. Ping result:", result);

    // Continue with server startup
    startServer();
    loadPlugins();
  }
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
          //@ts-ignore
          key: fs.readFileSync(path.join(__dirname, "../key.pem")),
          cert: fs.readFileSync(path.join(__dirname, "../cert.pem")),
        },
        // :{}
        app
      )
    : http.createServer(app);

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { schema, context: (_ctx, _msg, _args) => ({ pubsub }) },
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

  logger.info(
    `🚀 Server ready at ${
      process.env.NODE_ENV === "production" ? "https" : "http"
    }://localhost:4000/graphql`
  );
  logger.info(`🚀 Subscription endpoint ready at ws://localhost:4000/graphql`);
}
