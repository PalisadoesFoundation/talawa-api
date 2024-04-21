import { ApolloServer, BaseContext } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { makeExecutableSchema } from "@graphql-tools/schema";
import "dotenv/config"; // Pull all the environment variables from .env file
import fs from "fs";
import Fastify from "fastify";
import type { GraphQLFormattedError } from "graphql";
import depthLimit from "graphql-depth-limit";
import { PubSub } from "graphql-subscriptions";
import { useServer } from "graphql-ws/lib/use/ws";
import http from "http";
import https from "https";
import fastifyApollo, {
  fastifyApolloDrainPlugin,
} from "@as-integrations/fastify";
import path from "path";
import { WebSocketServer } from "ws";
import fastifyApp from "./app";
import { logIssues } from "./checks";
import loadPlugins from "./config/plugins/loadPlugins";
import * as database from "./db";
import authDirectiveTransformer from "./directives/directiveTransformer/authDirectiveTransformer";
import roleDirectiveTransformer from "./directives/directiveTransformer/roleDirectiveTransformer";
import { logger } from "./libraries";
import { isAuth } from "./middleware";
import { composedResolvers } from "./resolvers";
import { typeDefs } from "./typeDefs";
import { fastifyApolloHandler } from "@as-integrations/fastify";

export const pubsub = new PubSub();

// defines schema
let schema = makeExecutableSchema({
  typeDefs,
  resolvers: composedResolvers,
});

// Defines directives
schema = authDirectiveTransformer(schema, "auth");
schema = roleDirectiveTransformer(schema, "role");

const fastify = Fastify({
  http2: true,
  https: {
    key: fs.readFileSync(path.join(__dirname, "..", "https", "fastify.key")),
    cert: fs.readFileSync(path.join(__dirname, "..", "https", "fastify.cert")),
  },
});

// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer, enabling our servers to shut down gracefully.

// const httpServer =
//   process.env.NODE_ENV === "production"
// ? https.createServer(
//         {
//           key: fs.readFileSync(path.join(__dirname, "../key.pem")),
// cert: fs.readFileSync(path.join(__dirname, "../cert.pem")),
//         },
// // :{}
//         app,
//       )
//     : http.createServer(app);

// Below, we tell Apollo Server to "drain" this httpServer, enabling our servers to shut down gracefully.
const server = new ApolloServer<BaseContext>({
  schema,
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
    fastifyApolloDrainPlugin(fastify),
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
  // server: fastify,
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

async function startServer(): Promise<void> {
  await database.connect();

  await server.start();

  // fastifyApp.use(
  //   "/graphql",
  //   expressMiddleware(server, {
  //     context: async ({ req, res }) => ({
  //       ...isAuth(req),
  //       req,
  //       res,
  //       pubsub,
  //       apiRootUrl: `${req.protocol}://${req.get("host")}/`,
  //     }),
  //   }),
  // );

  // //Define a Fastify route handler for "/graphql" endpoint
  // fastify.post("/graphql", async (request, reply) => {
  //   // Create the context object for Apollo Server
  //   const context = {
  //     ...(await isAuth(request)),
  //     req: request,
  //     res: reply,
  //     pubsub: pubsub,
  //     apiRootUrl: `${request.protocol}://${request.hostname}/`,
  //   };

  //   const graphqlHandler = fastifyApolloHandler(server, { context });

  //   return graphqlHandler(request, reply);
  // });

  //   await fastify.register(fastifyApollo(server));

  //   // Modified server startup
  //   await new Promise<void>((resolve) =>
  //     httpServer.listen({ port: 4000 }, resolve),
  //   );

  // Log all the configuration related issues
  await logIssues();

  logger.info(
    `🚀 Server ready at ${
      process.env.NODE_ENV === "production" ? "https" : "http"
    }://localhost:4000/graphql`,
  );
  logger.info(`🚀 Subscription endpoint ready at ws://localhost:4000/graphql`);
}

startServer();
loadPlugins();
