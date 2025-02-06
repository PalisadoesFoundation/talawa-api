import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { usersTable } from "~/src/drizzle/tables/users";
import type { PubSub } from "./pubsub";

// Define types
export type ImplicitMercuriusContext = {
  pubsub: PubSub;
};

export type ExplicitAuthenticationTokenPayload = {
  user: Pick<typeof usersTable.$inferSelect, "id">;
};

export type CurrentClient =
  | ({ isAuthenticated: false } & { [K in keyof ExplicitAuthenticationTokenPayload]?: never })
  | ({ isAuthenticated: true } & ExplicitAuthenticationTokenPayload);

export type ExplicitGraphQLContext = {
  currentClient: CurrentClient;
  drizzleClient: FastifyInstance["drizzleClient"];
  envConfig: Pick<FastifyInstance["envConfig"], "API_BASE_URL">;
  jwt: {
    sign: (payload: ExplicitAuthenticationTokenPayload) => string;
  };
  log: FastifyInstance["log"];
  minio: FastifyInstance["minio"];
};

type InitialContext = {
  fastify: FastifyInstance;
  request: FastifyRequest;
} & (
  | { isSubscription: false; reply: FastifyReply; socket?: never }
  | { isSubscription: true; reply?: never; socket: WebSocket }
);

export type CreateContext = (
  initialContext: InitialContext
) => Promise<ExplicitGraphQLContext>;

export const createContext: CreateContext = async (initialContext) => {
  const { fastify, request } = initialContext;

  let currentClient: CurrentClient;
  try {
    const jwtPayload = await request.jwtVerify<ExplicitAuthenticationTokenPayload>();
    currentClient = {
      isAuthenticated: true,
      user: jwtPayload.user,
    };
  } catch (error) {
    currentClient = {
      isAuthenticated: false,
    };
  }

  return {
    currentClient,
    drizzleClient: fastify.drizzleClient,
    envConfig: fastify.envConfig,
    jwt: {
      sign: (payload: ExplicitAuthenticationTokenPayload) => fastify.jwt.sign(payload),
    },
    log: fastify.log,
    minio: fastify.minio,
  };
};
