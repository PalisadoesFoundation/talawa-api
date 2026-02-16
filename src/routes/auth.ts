import type { FastifyPluginAsync } from "fastify";
import { zReplyParsed } from "~/src/routes/validation/zodReply";
import {
	clearAuthCookies,
	revokeRefreshToken,
	rotateRefresh,
	setAuthCookies,
	signIn,
	signUp,
} from "~/src/services/auth";
import {
	COOKIE_NAMES,
	type CookieConfigOptions,
} from "~/src/utilities/cookieConfig";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";
import { refreshBody, signInBody, signUpBody } from "./auth/validators";

function getCookieOptionsFromApp(fastify: {
	envConfig?: {
		API_COOKIE_DOMAIN?: string;
		API_IS_SECURE_COOKIES?: boolean;
	};
}): CookieConfigOptions | undefined {
	const env = fastify.envConfig;
	if (!env) return undefined;
	return {
		domain: env.API_COOKIE_DOMAIN,
		isSecure: env.API_IS_SECURE_COOKIES ?? true,
		path: "/",
	};
}

/** Coerce user-agent header to string | undefined (handles string[] from IncomingHttpHeaders). */
function getUserAgent(
	header: string | string[] | undefined,
): string | undefined {
	if (header === undefined) return undefined;
	return Array.isArray(header) ? header[0] : header;
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
	const cookieOptions = getCookieOptionsFromApp(fastify);

	fastify.post(
		"/auth/signup",
		{ preHandler: fastify.rateLimit("auth") },
		async (req, reply) => {
			const body = await zReplyParsed(reply, signUpBody, req.body);
			if (body === undefined) return;

			const signUpResult = await signUp(fastify.drizzleClient, req.log, body);
			if ("error" in signUpResult) {
				throw new TalawaRestError({
					code: ErrorCode.ALREADY_EXISTS,
					message: "Email already registered",
				});
			}

			const signInResult = await signIn(fastify.drizzleClient, req.log, {
				email: body.email,
				password: body.password,
				ip: req.ip,
				userAgent: getUserAgent(req.headers["user-agent"]),
			});
			if ("error" in signInResult) {
				throw new TalawaRestError({
					code: ErrorCode.INTERNAL_SERVER_ERROR,
					message: "Failed to sign in after signup",
				});
			}

			setAuthCookies(
				reply,
				{
					access: signInResult.access,
					refresh: signInResult.refresh,
				},
				cookieOptions,
			);
			return reply.send({
				user: {
					id: signInResult.user.id,
					email: signInResult.user.emailAddress,
				},
			});
		},
	);

	fastify.post(
		"/auth/signin",
		{ preHandler: fastify.rateLimit("auth") },
		async (req, reply) => {
			const body = await zReplyParsed(reply, signInBody, req.body);
			if (body === undefined) return;

			const result = await signIn(fastify.drizzleClient, req.log, {
				...body,
				ip: req.ip,
				userAgent: getUserAgent(req.headers["user-agent"]),
			});
			if ("error" in result) {
				throw new TalawaRestError({
					code: ErrorCode.UNAUTHENTICATED,
					message: "Invalid credentials",
				});
			}

			setAuthCookies(
				reply,
				{
					access: result.access,
					refresh: result.refresh,
				},
				cookieOptions,
			);
			return reply.send({
				user: { id: result.user.id, email: result.user.emailAddress },
			});
		},
	);

	fastify.post(
		"/auth/refresh",
		{ preHandler: fastify.rateLimit("auth") },
		async (req, reply) => {
			const body = await zReplyParsed(reply, refreshBody, req.body ?? {});
			if (body === undefined) return;

			const token =
				body.refreshToken ?? req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
			if (!token) {
				throw new TalawaRestError({
					code: ErrorCode.UNAUTHENTICATED,
					message: "Missing refresh token",
				});
			}

			const out = await rotateRefresh(fastify.drizzleClient, req.log, token);
			if ("error" in out) {
				throw new TalawaRestError({
					code: ErrorCode.UNAUTHENTICATED,
					message: "Invalid refresh token",
				});
			}

			setAuthCookies(
				reply,
				{ access: out.access, refresh: out.refresh },
				cookieOptions,
			);
			return reply.send({ ok: true });
		},
	);

	fastify.post("/auth/logout", async (req, reply) => {
		const rt = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
		if (rt) {
			await revokeRefreshToken(fastify.drizzleClient, rt);
		}
		clearAuthCookies(reply, cookieOptions);
		return reply.send({ ok: true });
	});
};

export default authRoutes;
