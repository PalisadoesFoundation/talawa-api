/**
 * In-memory fake Redis implementation for tests that need rate-limit or
 * similar logic using sorted sets (Z*), pipeline, and expire.
 * Pipeline exec intentionally catches and returns errors as [err, null] to mimic Redis semantics.
 */
// validate-error-handling-disable — FakeRedis catch intentionally swallows to mimic pipeline exec
export class FakeRedisZ {
	private z = new Map<string, Array<{ s: number; m: string }>>();

	pipeline() {
		const self = this;
		const commands: (() => Promise<unknown>)[] = [];
		return {
			zremrangebyscore(
				key: string,
				min: number | string,
				max: number | string,
			) {
				commands.push(() => self.zremrangebyscore(key, min, max));
				return this;
			},
			zcard(key: string) {
				commands.push(() => self.zcard(key));
				return this;
			},
			zadd(key: string, score: number, member: string) {
				commands.push(() => self.zadd(key, score, member));
				return this;
			},
			zrange(
				key: string,
				start: number,
				stop: number,
				withScores?: "WITHSCORES",
			) {
				commands.push(() => self.zrange(key, start, stop, withScores));
				return this;
			},
			expire(key: string, sec: number) {
				commands.push(() => self.expire(key, sec));
				return this;
			},
			async exec() {
				const results = [];
				for (const cmd of commands) {
					try {
						const res = await cmd();
						results.push([null, res]);
					} catch (err) {
						results.push([err, null]);
					}
				}
				return results;
			},
		};
	}

	async zremrangebyscore(
		key: string,
		min: number | string,
		max: number | string,
	) {
		const arr = this.z.get(key) ?? [];
		const lo = min === "-inf" ? -Infinity : Number(min);
		const hi = max === "+inf" ? Infinity : Number(max);
		this.z.set(
			key,
			arr.filter((e) => e.s < lo || e.s > hi),
		);
	}
	async zcard(key: string) {
		return (this.z.get(key) ?? []).length;
	}
	async zadd(key: string, score: number, member: string) {
		const arr = this.z.get(key) ?? [];
		const existingIndex = arr.findIndex((e) => e.m === member);
		if (existingIndex !== -1 && arr[existingIndex]) {
			arr[existingIndex].s = score;
		} else {
			arr.push({ s: score, m: member });
		}
		arr.sort((a, b) => a.s - b.s);
		this.z.set(key, arr);
	}
	async zrange(
		key: string,
		start: number,
		stop: number,
		withScores?: "WITHSCORES",
	) {
		const arr = this.z.get(key) ?? [];
		const slice = arr.slice(start, stop + 1);
		if (withScores === "WITHSCORES") {
			const flat: string[] = [];
			slice.forEach((e) => {
				flat.push(e.m);
				flat.push(String(e.s));
			});
			return flat;
		}
		return slice.map((e) => e.m);
	}
	async expire(_key: string, _sec: number) {
		/* noop */
	}
}
