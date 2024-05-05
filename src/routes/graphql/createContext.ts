import type { PubSub, YogaInitialContext } from "graphql-yoga";
import { verify, TokenExpiredError } from "jsonwebtoken";
import type { InterfaceJwtTokenPayload } from "../../utilities";
import type { PubSubPublishArgsByKey } from "./pubSub";
import type { GraphQLServerContext } from "./server";
import type { Env } from "../../env";

/**
 * Type of authentication context of a client making a request to the graphQL server.
 *
 * @privateRemarks This type has unintuitive fields and will be changed in the future.
 */
export type CurrentClientAuthContext = {
  expired: boolean | undefined;
  isAuth: false;
  userId: string | undefined;
};

/**
 * Type of the initial context argument provided to the createContext function by the
 * graphQL server.
 */
type InitialContext = GraphQLServerContext &
  YogaInitialContext & {
    env: Env;
    pubSub: PubSub<PubSubPublishArgsByKey>;
  };

/**
 * Type of the context passed to the graphQL resolvers on each request.
 */
export type GraphQLUserContext = {
  apiRootUrl: string;
  pubSub: PubSub<PubSubPublishArgsByKey>;
} & CurrentClientAuthContext;

/**
 * This function is responsible for creating a new graphQL context that is scoped to each
 * instance of a graphQL request that a client makes to the graphQL server. The context
 * returned from this function is passed as the third argument to the graphQL resolvers.
 * This function should be designed carefully as to not let the HTTP framework specific
 * details permeate into the graphQL resolvers. This avoids coupling the graphQL layer
 * with the HTTP framework that is being used to serve the graphQL server. It should also
 * be made sure that the context returned from this function is not mutable because it is
 * a piece of shared state between all the graphQL resolvers and could introduce weird,
 * hard to detect bugs and anomalies at runtime. More information about the graphQL context
 * can be found here:- {@link https://the-guild.dev/graphql/yoga-server/docs/features/context#extending-the-initial-context}
 */
export const createContext = async ({
  apiRootUrl,
  env,
  pubSub,
  request,
}: InitialContext): Promise<GraphQLUserContext> => {
  /**
   * As this function is traversed, this object will be mutated accordingly.
   */
  const authContext: CurrentClientAuthContext = {
    expired: undefined,
    isAuth: false,
    userId: undefined,
  };

  const authorizationHeader = request.headers.get("Authorization");

  if (authorizationHeader !== null) {
    const token = authorizationHeader.split(" ")[1];

    if (token !== undefined && token !== "") {
      try {
        const decodedToken = verify(
          token,
          env.ACCESS_TOKEN_SECRET,
        ) as InterfaceJwtTokenPayload;

        authContext.expired = false;
        authContext.userId = decodedToken.userId;
      } catch (error) {
        if (error instanceof TokenExpiredError) {
          authContext.expired = true;
        }
      }
    }
  }

  return {
    ...authContext,
    apiRootUrl,
    pubSub,
  };
};
