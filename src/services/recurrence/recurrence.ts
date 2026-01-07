// Weekday abbreviations that match the RRULE BYDAY values
export type Weekday = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";

// Frequency values supported by our recurrence engine
export type Freq = "DAILY" | "WEEKLY" | "MONTHLY";

export type RecurrenceRule = {
	freq: Freq; // example : DAILY
	byDay?: Weekday[]; // example : ["MO","FR"]
	interval: number; // >=1
	count?: number; // stops after some nth count
	until?: Date; // stop before some date
};

// Parse an RFC5545 RRULE string into our RecurrenceRule shape
export function parseRRule(rrule: string): RecurrenceRule {
	const map = rrule.split(";").reduce<Record<string, string>>((acc, part) => {
		const [k = "", v = ""] = part.split("=");
		const key = k.trim().toUpperCase();
		const value = v.trim();
		if (key) {
			acc[key] = value;
		}
		return acc;
	}, {});
	const freq = (map.FREQ ?? "WEEKLY") as Freq;
	const interval = Math.max(1, Number(map.INTERVAL ?? "1"));
	const byDay = map.BYDAY
		? (map.BYDAY.split(",").map((s: string) => s.trim()) as Weekday[])
		: undefined;
	const count = map.COUNT ? Number(map.COUNT) : undefined;
	const until = map.UNTIL ? new Date(map.UNTIL) : undefined;
	return { freq, interval, byDay, count, until };
}

// helpers
export function addDays(d: Date, n: number): Date {
	const dt = new Date(d.getTime() + n * 24 * 60 * 60 * 1000);
	return dt;
}

export function addWeeks(d: Date, n: number): Date {
	return addDays(d, n * 7);
}

export type Occurrence = {
	startAt: Date;
	endAt: Date;
	seq: number;
};

const WEEKDAY_CODES: Weekday[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export const weekOffset: Record<Weekday, number> = {
	SU: 0,
	MO: 1,
	TU: 2,
	WE: 3,
	TH: 4,
	FR: 5,
	SA: 6,
};

// The function would return number of days in the month
export function daysInMonth(year: number, monthIdx: number): number {
	if (monthIdx < 0 || monthIdx > 11) {
		throw new RangeError(
			`monthIdx must be between 0 (January) and 11 (December). Received: ${monthIdx}`,
		);
	}
	return new Date(year, monthIdx + 1, 0).getDate();
}
function getWeekdayCode(date: Date): Weekday {
	return WEEKDAY_CODES[date.getDay()] as Weekday;
}
export function startOfWeek(dt: Date): Date {
	const dayIdx = dt.getDay();
	return addDays(dt, -1 * dayIdx);
}
export function addMonthSafely(base: Date, monthsToAdd: number): Date {
	const baseYear = base.getFullYear();
	const baseMonth = base.getMonth();
	const baseDay = base.getDate();
	// Jump to first day of the target month to detect overflow (e.g., 31st -> February)
	const temp = new Date(baseYear, baseMonth + monthsToAdd, 1);
	const targetYear = temp.getFullYear();
	const targetMonth = temp.getMonth();
	const dim = daysInMonth(targetYear, targetMonth);
	const targetDay = Math.min(baseDay, dim);
	return new Date(
		targetYear,
		targetMonth,
		targetDay,
		base.getHours(),
		base.getMinutes(),
		base.getSeconds(),
		base.getMilliseconds(),
	);
}
export function generateOccurrences(
	baseStart: Date,
	baseEnd: Date,
	rule: RecurrenceRule,
	windowStart: Date,
	windowEnd: Date,
): Occurrence[] {
	if (rule.interval < 1 || !Number.isFinite(rule.interval)) {
		throw new Error("Recurrence interval must be >= 1");
	}
	const results: Occurrence[] = [];
	let sequence = 0;
	// Duration stays constant across recurrences; we only slide the start timestamp
	const eventDurationInMs = baseEnd.getTime() - baseStart.getTime();
	const stopAt =
		rule.until && rule.until.getTime() < windowEnd.getTime()
			? rule.until
			: windowEnd;
	const windowStartTime = windowStart.getTime();
	const stopAtTime = stopAt.getTime();
	/**
	 * NOTE:
	 * COUNT limits the total theoretical recurrence sequence defined by the rule,
	 * not the number of occurrences returned within a given window.
	 * The window only filters visibility.
	 */
	const recordOccurrence = (start: Date) => {
		const seqValue = sequence + 1;
		const startTime = start.getTime();
		const endTime = startTime + eventDurationInMs;
		sequence = seqValue;

		if (endTime <= windowStartTime || startTime >= stopAtTime) {
			return;
		}

		results.push({ startAt: start, endAt: new Date(endTime), seq: seqValue });
	};

	if (rule.freq === "DAILY") {
		for (
			let candidate = new Date(baseStart);
			candidate < stopAt;
			candidate = addDays(candidate, rule.interval)
		) {
			if (rule.count && sequence >= rule.count) {
				break;
			}
			recordOccurrence(candidate);
		}
	} else if (rule.freq === "WEEKLY") {
		const weekStart = startOfWeek(baseStart);
		// Default to the weekday of the template when BYDAY is omitted per RFC expectations
		const allowedDays = (
			rule.byDay && rule.byDay.length > 0
				? rule.byDay
				: [getWeekdayCode(baseStart)]
		)
			.slice()
			.sort((a, b) => weekOffset[a] - weekOffset[b]);

		for (let ws = weekStart; ws < stopAt; ws = addWeeks(ws, rule.interval)) {
			for (const day of allowedDays) {
				if (rule.count && sequence >= rule.count) {
					break;
				}
				const offset = weekOffset[day];
				if (typeof offset !== "number") {
					continue;
				}
				const candidate = addDays(ws, offset);
				if (candidate < baseStart) {
					continue;
				}
				if (rule.until && candidate > rule.until) {
					continue;
				}
				recordOccurrence(candidate);
			}
			if (rule.count && sequence >= rule.count) {
				break;
			}
		}
	} else {
		let i = 0;
		while (true) {
			if (rule.count && sequence >= rule.count) break;
			const candidate = addMonthSafely(baseStart, i * rule.interval);
			i++;
			if (candidate >= stopAt) break;
			if (rule.until && candidate > rule.until) break;
			recordOccurrence(candidate);
		}
	}
	return results;
}
