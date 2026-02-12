/**
 * Fastify auth plugin: sets request.currentUser from a valid access JWT
 * (cookie or Authorization: Bearer) and provides app.requireAuth() for protected routes.
 */
import type {
	FastifyInstance,
	FastifyReply,
	FastifyRequest,
	preHandlerHookHandler,
} from "fastify";
import fp from "fastify-plugin";
import { verifyToken } from "~/src/services/auth/tokens";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

/** Authenticated user set on the request by the auth plugin. Single authoritative shape for FastifyRequest.currentUser. */
export interface CurrentUser {
	id: string;
	email?: string;
}

/** Access token payload shape used when verifying; typ must be "access" to set currentUser. JWTs may omit sub or typ. */
type AccessPayload = { sub?: string; email?: string; typ?: string };

declare module "fastify" {
	interface FastifyInstance {
		requireAuth(): preHandlerHookHandler;
	}
	interface FastifyRequest {
		currentUser?: CurrentUser;
	}
}

const BEARER_PREFIX = /^Bearer\s+/i;

/**
 * Reads the access token from the request: cookie first (COOKIE_NAMES.ACCESS_TOKEN),
 * then Authorization header when it starts with Bearer (case-insensitive, via BEARER_PREFIX).
 * Returns null when no token is present or the trimmed value is empty.
 *
 * @param req - The Fastify request.
 * @returns The token string, or null if none found.
 */
function getTokenFromRequest(req: FastifyRequest): string | null {
	const cookieAt = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];
	const authHeader = (req.headers.authorization ?? "").trim();
	const bearer = BEARER_PREFIX.test(authHeader)
		? authHeader.replace(BEARER_PREFIX, "").trim()
		: "";
	const raw = cookieAt || bearer || "";
	const token = raw.trim();
	return token || null;
}

/**
 * Registers a global preHandler hook that populates `req.currentUser` from a valid access JWT
 * (via getTokenFromRequest and verifyToken with AccessPayload), and decorates the app with
 * requireAuth() for protecting routes.
 *
 * @param app - The Fastify instance to register on; it will receive a preHandler that sets
 *   req.currentUser when a valid access token is present (cookie or Bearer), and a requireAuth()
 *   decorator that returns a preHandler which throws if req.currentUser is not set.
 * @returns Resolves when the preHandler hook and requireAuth decorator are registered.
 */
async function authPlugin(app: FastifyInstance): Promise<void> {
	// Global preHandler: runs on every request and only sets req.currentUser when a valid
	// access token is present. This is not a route handler; rate limiting is applied per-route
	// (e.g. login, refresh, protected routes) where handlers are registered.
	app.addHook("preHandler", async (req) => {
		const token = getTokenFromRequest(req);
		if (!token) return;

		try {
			const payload = await verifyToken<AccessPayload>(token);
			if (payload.typ !== "access" || !payload.sub) return;
			req.currentUser = {
				id: payload.sub,
				email: payload.email,
			} satisfies CurrentUser;
		} catch (err) {
			req.log.debug(
				{ err },
				"Invalid or expired token; request remains unauthenticated",
			);
		}
	});

	app.decorate("requireAuth", function requireAuth(): preHandlerHookHandler {
		return async (req: FastifyRequest, _reply: FastifyReply) => {
			if (!req.currentUser) {
				throw new TalawaRestError({
					code: ErrorCode.UNAUTHENTICATED,
					message: "Authentication required",
				});
			}
		};
	});
}

export default fp(authPlugin, {
	name: "auth",
	dependencies: ["@fastify/cookie"],
});
