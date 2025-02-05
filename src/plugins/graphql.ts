import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { mercurius } from 'mercurius';
import { mercuriusUpload } from 'mercurius-upload';
import { createContext } from '~/src/graphql/context';
import { verifyClient, onConnect } from '~/src/utilities/auth';
import { schema } from '~/src/graphql/schema';

export const graphql = fastifyPlugin(async (fastify: FastifyInstance) => {
  fastify.register(mercuriusUpload, {
    maxFieldSize: 1048576,
    maxFiles: 20,
    maxFileSize: 10485760,
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
    path: '/graphql',
    schema,
    subscription: {
      context: async (socket, request) =>
        await createContext({
          fastify,
          isSubscription: true,
          request,
          socket,
        }),
      keepAlive: 1000 * 30,
      onConnect,
      onDisconnect: (ctx) => {},
      verifyClient,
    },
  });
});

export default graphql;
