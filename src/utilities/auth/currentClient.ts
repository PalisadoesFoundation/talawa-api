import type { FastifyInstance, FastifyRequest } from "fastify";
import type {
	CurrentClient,
	ExplicitAuthenticationTokenPayload,
} from "~/src/graphql/context";
import type { AccessClaims } from "~/src/services/auth/tokens";
import { verifyToken } from "~/src/services/auth/tokens";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";

const BEARER_RE = /^Bearer\s+/i;

/**
 * Resolves the current client from the request using the same dual-token order
 * as GraphQL context: Bearer legacy → Bearer REST → Cookie legacy → Cookie REST.
 * If no valid user id is produced, returns unauthenticated.
 * Used by both createContext and the preExecution rate-limit hook.
 */
export async function resolveCurrentClient(
	fastify: FastifyInstance,
	request: FastifyRequest,
): Promise<CurrentClient> {
	let currentClient: CurrentClient = { isAuthenticated: false };

	const authHeader = (request.headers?.authorization ?? "").trim();
	const bearerToken = BEARER_RE.test(authHeader)
		? authHeader.replace(BEARER_RE, "").trim()
		: "";

	if (bearerToken) {
		try {
			const jwtPayload =
				await request.jwtVerify<ExplicitAuthenticationTokenPayload>();
			if (jwtPayload?.user?.id) {
				currentClient = { isAuthenticated: true, user: jwtPayload.user };
				return currentClient;
			}
		} catch (err) {
			if (request.log?.debug) {
				request.log.debug(
					{ err },
					"Legacy JWT verification failed; trying REST Bearer",
				);
			}
		}
		try {
			const restPayload = await verifyToken<AccessClaims>(bearerToken);
			if (restPayload?.typ === "access" && restPayload?.sub) {
				currentClient = {
					isAuthenticated: true,
					user: { id: restPayload.sub },
				};
				return currentClient;
			}
		} catch (err) {
			if (request.log?.debug) {
				request.log.debug(
					{ err },
					"REST Bearer verification failed; leaving unauthenticated",
				);
			}
		}
	} else {
		const accessTokenFromCookie = request.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];
		if (accessTokenFromCookie) {
			try {
				const jwtPayload =
					await fastify.jwt.verify<ExplicitAuthenticationTokenPayload>(
						accessTokenFromCookie,
					);
				if (jwtPayload?.user?.id) {
					currentClient = { isAuthenticated: true, user: jwtPayload.user };
					return currentClient;
				}
			} catch (err) {
				if (request.log?.debug) {
					request.log.debug(
						{ err },
						"Legacy cookie JWT verification failed; trying REST cookie",
					);
				}
			}
			try {
				const restPayload = await verifyToken<AccessClaims>(
					accessTokenFromCookie,
				);
				if (restPayload?.typ === "access" && restPayload?.sub) {
					currentClient = {
						isAuthenticated: true,
						user: { id: restPayload.sub },
					};
					return currentClient;
				}
			} catch (err) {
				if (request.log?.debug) {
					request.log.debug(
						{ err },
						"REST cookie verification failed; leaving unauthenticated",
					);
				}
			}
		}
	}

	// Ensure we never return authenticated without a user id
	if (!currentClient.user?.id) {
		return { isAuthenticated: false };
	}
	return currentClient;
}
