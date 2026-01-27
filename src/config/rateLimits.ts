export type RateLimitTier = {
	name: string;
	windowMs: number;
	max: number;
};

export const rateLimitTiers = {
	open: {
		name: "open",
		windowMs: 60_000,
		max: Number.POSITIVE_INFINITY,
	} as RateLimitTier,
	normal: { name: "normal", windowMs: 60_000, max: 100 } as RateLimitTier, // 100 req/min
	burst: { name: "burst", windowMs: 60_000, max: 300 } as RateLimitTier, // 300 req/min
	auth: { name: "auth", windowMs: 60_000, max: 20 } as RateLimitTier, // 20 req/min
	healthcheck: {
		name: "healthcheck",
		windowMs: 60_000,
		max: 600,
	} as RateLimitTier, // relaxed
};

export function getTier(name: keyof typeof rateLimitTiers): RateLimitTier {
	return rateLimitTiers[name];
}
