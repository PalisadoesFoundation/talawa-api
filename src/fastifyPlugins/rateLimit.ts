import type {
	FastifyInstance,
	FastifyReply,
	FastifyRequest,
	preHandlerHookHandler,
} from "fastify";
import fp from "fastify-plugin";
import { getTier, type RateLimitTier } from "~/src/config/rateLimits";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";
import { leakyBucket } from "~/src/utilities/leakyBucket";

declare module "fastify" {
	interface FastifyInstance {
		rateLimit(
			tier:
				| keyof typeof import("~/src/config/rateLimits").rateLimitTiers
				| RateLimitTier,
		): preHandlerHookHandler;
	}
	interface FastifyRequest {
		currentUser?: { id: string };
	}
}

function identityFromRequest(req: FastifyRequest): string {
	// Prefer authenticated userId, fallback to IP
	const userId: string | undefined = req.currentUser?.id;
	const ip = req.ip;
	return userId ? `user:${userId}` : `ip:${ip}`;
}

function setHeaders(
	reply: FastifyReply,
	tier: RateLimitTier,
	remaining: number,
	resetAt: number,
) {
	reply.header("X-RateLimit-Limit", tier.max);
	reply.header("X-RateLimit-Remaining", Math.max(0, remaining));
	reply.header("X-RateLimit-Reset", Math.ceil(resetAt / 1000)); // seconds epoch
}

export default fp(
	async function rateLimitPlugin(app: FastifyInstance) {
		const redis = app.redis; // assume you registered Redis elsewhere
		if (!redis) {
			app.log.warn(
				"No Redis client found; rate limiting will degrade to allow-all.",
			);
		}

		app.decorate(
			"rateLimit",
			(
				tierOrName:
					| keyof typeof import("~/src/config/rateLimits").rateLimitTiers
					| RateLimitTier,
			) => {
				const tier =
					typeof tierOrName === "string" ? getTier(tierOrName) : tierOrName;

				if (!Number.isFinite(tier.max)) {
					// open tier: no limiting
					return async (_req, reply) => {
						setHeaders(
							reply,
							tier,
							Number.POSITIVE_INFINITY,
							Date.now() + tier.windowMs,
						);
					};
				}

				const handler: preHandlerHookHandler = async (req, reply) => {
					if (!redis) {
						// degrade
						setHeaders(reply, tier, tier.max, Date.now() + tier.windowMs);
						return;
					}

					// make route-scoped key: tier + identity + method + path
					const who = identityFromRequest(req);
					const routePath = (
						req.routeOptions.url ||
						(req as unknown as { routerPath: string }).routerPath ||
						req.url ||
						""
					).split("?")[0];
					const key = `talawa:v1:rl:${tier.name}:${who}:${routePath}:${req.method}`;

					const { allowed, remaining, resetAt } = await leakyBucket(
						redis,
						key,
						tier.max,
						tier.windowMs,
						req.log,
					);
					setHeaders(reply, tier, remaining, resetAt);

					if (!allowed) {
						// 429 with unified error payload
						throw new TalawaRestError({
							code: ErrorCode.RATE_LIMIT_EXCEEDED,
							message: "Too many requests. Please try again later.",
							details: { resetAt: Math.ceil(resetAt / 1000) }, // Convert to seconds for consistency with X-RateLimit-Reset header
							statusCodeOverride: 429,
						});
					}
				};

				return handler;
			},
		);

		app.log.info({ msg: "RateLimit plugin registered" });
	},
	{
		name: "rateLimit",
		// dependencies: ["@fastify/redis"],
	},
);
