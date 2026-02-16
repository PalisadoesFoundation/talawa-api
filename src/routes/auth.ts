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

/**
 * Builds cookie options from the Fastify instance's envConfig when present.
 *
 * @param fastify - Object with optional envConfig. envConfig may contain
 *   API_COOKIE_DOMAIN (optional string) and API_IS_SECURE_COOKIES (optional boolean).
 * @returns CookieConfigOptions (domain, isSecure, path) when envConfig exists,
 *   or undefined when envConfig is missing.
 */
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

/**
 * Masks an email for safe logging (avoids PII). Keeps first character and domain.
 * @example "a@b.co" -> "a***@b.co"; "user@example.com" -> "u***@example.com"
 */
function maskEmailForLog(email: string): string {
	const at = email.indexOf("@");
	if (at <= 0 || at === email.length - 1) return "[redacted]";
	return `${email[0]}***@${email.slice(at + 1)}`;
}

/**
 * Fastify plugin that registers REST auth routes: POST /auth/signup, /auth/signin,
 * /auth/refresh, and /auth/logout. All routes use the "auth" rate limit, request
 * validation via zReplyParsed and auth validators, and the auth service for
 * sign-up, sign-in, token rotation, and cookie handling.
 *
 * @param fastify - Fastify instance. Must provide drizzleClient and rateLimit("auth").
 *   Optional envConfig with API_COOKIE_DOMAIN (string) and API_IS_SECURE_COOKIES (boolean).
 *   When present, used to build cookie options for setAuthCookies/clearAuthCookies.
 * @returns Promise that resolves when the plugin is registered (FastifyPluginAsync).
 */
const authRoutes: FastifyPluginAsync = async (fastify) => {
	const cookieOptions = getCookieOptionsFromApp(fastify);
	const authRateLimit = [fastify.rateLimit("auth")];

	fastify.post(
		"/auth/signup",
		{ preHandler: authRateLimit },
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
				req.log.warn(
					{
						emailMasked: maskEmailForLog(body.email),
						createdUserId: signUpResult.user.id,
						ip: req.ip,
						signInError: signInResult.error,
						msg: "signIn failed after signUp — user created but session not established; may need to reconcile orphaned account",
					},
					"signIn failed after signUp",
				);
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
			return reply.code(201).send({
				user: {
					id: signInResult.user.id,
					email: signInResult.user.emailAddress,
				},
			});
		},
	);

	fastify.post(
		"/auth/signin",
		{ preHandler: authRateLimit },
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
		{ preHandler: authRateLimit },
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

	fastify.post(
		"/auth/logout",
		{ preHandler: authRateLimit },
		async (req, reply) => {
			const rt = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
			if (rt) {
				try {
					await revokeRefreshToken(fastify.drizzleClient, rt);
				} catch (err) {
					req.log.warn({ err, msg: "revokeRefreshToken failed on logout" });
				}
			}
			clearAuthCookies(reply, cookieOptions);
			return reply.send({ ok: true });
		},
	);
};

export default authRoutes;
