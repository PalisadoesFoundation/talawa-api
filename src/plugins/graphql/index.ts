import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";
import mercurius from "mercurius";
import { mercuriusUpload } from "mercurius-upload";
import { createContext } from "~/src/graphql/context";
import { verifyClient, onConnect } from "~/src/utilities/auth";
import { schema } from "~/src/graphql/schema";

export const graphqlPlugin = fastifyPlugin(async (fastify: FastifyInstance) => {
  fastify.register(mercuriusUpload, {
    maxFieldSize: fastify.envConfig.UPLOAD_MAX_FIELD_SIZE || 1048576,
    maxFiles: fastify.envConfig.UPLOAD_MAX_FILES || 20,
    maxFileSize: fastify.envConfig.UPLOAD_MAX_FILE_SIZE || 10485760,
  });

  fastify.register(mercurius, {
    context: (request: FastifyRequest, reply: FastifyReply) =>
      createContext({
        fastify,
        isSubscription: false,
        request,
        reply,
      }),
    graphiql: {
      enabled: fastify.envConfig.API_IS_GRAPHIQL,
    },
    path: "/graphql",
    schema,
    subscription: {
      context: async (socket: any, request: FastifyRequest) =>
        await createContext({
          fastify,
          isSubscription: true,
          request,
          socket,
        }),
      keepAlive: 1000 * 30,
      onConnect: (data: { type: "connection_init"; payload: { authToken: string } }) => {
        return onConnect(data.payload);
      },
      verifyClient,
    },
  });
});

export default graphqlPlugin;
