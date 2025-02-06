import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import mercurius from 'mercurius';
import { mercuriusUpload } from 'mercurius-upload';
import { createContext } from '~/src/graphql/context';
import { verifyClient } from '~/src/utilities/auth';
import { schema } from '~/src/graphql/schema';

export const graphql = fastifyPlugin(async (fastify: FastifyInstance) => {
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
      onConnect: (data: { type: 'connection_init'; payload: { authToken: string } }) => {
        const { authToken } = data.payload;
        if (authToken) {
          try {
            const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
            if (!JWT_SECRET_KEY) {
              throw new Error('JWT_SECRET_KEY environment variable is not set.');
            }
            import jwt from 'jsonwebtoken';

            const user = jwt.verify(authToken, JWT_SECRET_KEY);
            return { user };
          } catch (err) {
            throw new Error('Invalid auth token');
          }
        }
        throw new Error('Missing auth token');
      },
      onDisconnect: (ctx) => {},
      verifyClient,
    },
  });
});

export default graphql;
