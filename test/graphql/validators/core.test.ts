import { describe, expect, it } from "vitest";
import {
	coerceDate,
	createPostInput,
	email,
	eventId,
	eventRangeInput,
	id,
	isoDateString,
	isoDateTimeString,
	nonEmptyString,
	organizationIdArg,
	orgId,
	pagination,
	postId,
	postSort,
	sortOrder,
	trimmedString,
	ulid,
	url,
	userId,
	uuid,
} from "~/src/graphql/validators/core";

describe("Basic Scalars", () => {
	describe("trimmedString", () => {
		it("trims whitespace from both ends", async () => {
			const result = await trimmedString.parseAsync("  hello  ");
			expect(result).toBe("hello");
		});

		it("accepts empty strings after trimming", async () => {
			const result = await trimmedString.parseAsync("   ");
			expect(result).toBe("");
		});
	});

	describe("nonEmptyString", () => {
		it("accepts non-empty strings", async () => {
			const result = await nonEmptyString.parseAsync("hello");
			expect(result).toBe("hello");
		});

		it("trims and accepts non-empty result", async () => {
			const result = await nonEmptyString.parseAsync("  hello  ");
			expect(result).toBe("hello");
		});

		it("rejects empty strings", async () => {
			await expect(nonEmptyString.parseAsync("")).rejects.toThrow();
		});

		it("rejects whitespace-only strings", async () => {
			await expect(nonEmptyString.parseAsync("   ")).rejects.toThrow(
				"Must not be empty",
			);
		});
	});

	describe("email", () => {
		it("accepts valid email addresses", async () => {
			const result = await email.parseAsync("test@example.com");
			expect(result).toBe("test@example.com");
		});

		it("trims whitespace", async () => {
			const result = await email.parseAsync("  test@example.com  ");
			expect(result).toBe("test@example.com");
		});

		it("rejects invalid email addresses", async () => {
			await expect(email.parseAsync("not-an-email")).rejects.toThrow(
				"Must be a valid email",
			);
		});
	});

	describe("url", () => {
		it("accepts valid URLs", async () => {
			const result = await url.parseAsync("https://example.com");
			expect(result).toBe("https://example.com");
		});

		it("rejects invalid URLs", async () => {
			await expect(url.parseAsync("not-a-url")).rejects.toThrow(
				"Must be a valid URL",
			);
		});
	});

	describe("uuid", () => {
		it("accepts valid UUIDs", async () => {
			const validUuid = "550e8400-e29b-41d4-a716-446655440000";
			const result = await uuid.parseAsync(validUuid);
			expect(result).toBe(validUuid);
		});

		it("rejects invalid UUIDs", async () => {
			await expect(uuid.parseAsync("not-a-uuid")).rejects.toThrow(
				"Must be a valid UUID",
			);
		});

		it("rejects empty strings", async () => {
			await expect(uuid.parseAsync("")).rejects.toThrow();
		});
	});

	describe("ulid", () => {
		it("accepts valid ULIDs", async () => {
			const validUlid = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
			const result = await ulid.parseAsync(validUlid);
			expect(result).toBe(validUlid);
		});

		it("rejects invalid ULIDs", async () => {
			await expect(ulid.parseAsync("not-a-ulid")).rejects.toThrow(
				"Must be a valid ULID",
			);
		});

		it("rejects ULIDs with incorrect length", async () => {
			await expect(ulid.parseAsync("01ARZ3NDEK")).rejects.toThrow();
		});

		it("rejects ULIDs with lowercase characters", async () => {
			await expect(
				ulid.parseAsync("01arz3ndektsv4rrffq69g5fav"),
			).rejects.toThrow("Must be a valid ULID");
		});
	});
});

describe("Date/Time Validators", () => {
	describe("isoDateString", () => {
		it("accepts valid ISO date strings", async () => {
			const result = await isoDateString.parseAsync("2024-01-15");
			expect(result).toBe("2024-01-15");
		});

		it("rejects invalid date formats", async () => {
			await expect(isoDateString.parseAsync("01/15/2024")).rejects.toThrow(
				"Invalid ISO date",
			);
		});

		it("rejects datetime strings", async () => {
			await expect(
				isoDateString.parseAsync("2024-01-15T10:30:00Z"),
			).rejects.toThrow();
		});

		it("rejects semantically invalid dates (e.g., 2024-99-99)", async () => {
			await expect(isoDateString.parseAsync("2024-99-99")).rejects.toThrow(
				"Invalid ISO date",
			);
		});
	});

	describe("isoDateTimeString", () => {
		it("accepts valid ISO datetime strings with Z", async () => {
			const result = await isoDateTimeString.parseAsync("2024-01-15T10:30:00Z");
			expect(result).toBe("2024-01-15T10:30:00Z");
		});

		it("accepts datetime with milliseconds", async () => {
			const result = await isoDateTimeString.parseAsync(
				"2024-01-15T10:30:00.123Z",
			);
			expect(result).toBe("2024-01-15T10:30:00.123Z");
		});

		it("rejects datetime without Z suffix", async () => {
			await expect(
				isoDateTimeString.parseAsync("2024-01-15T10:30:00"),
			).rejects.toThrow("Invalid ISO datetime");
		});

		it("rejects date-only strings", async () => {
			await expect(
				isoDateTimeString.parseAsync("2024-01-15"),
			).rejects.toThrow();
		});
	});

	describe("coerceDate", () => {
		it("accepts Date objects", async () => {
			const date = new Date("2024-01-15");
			const result = await coerceDate.parseAsync(date);
			expect(result).toBeInstanceOf(Date);
			expect(result.toISOString()).toBe(date.toISOString());
		});

		it("coerces ISO strings to Date", async () => {
			const result = await coerceDate.parseAsync("2024-01-15T10:30:00Z");
			expect(result).toBeInstanceOf(Date);
		});

		it("coerces timestamps to Date", async () => {
			const timestamp = 1705318200000; // 2024-01-15T10:30:00.000Z
			const result = await coerceDate.parseAsync(timestamp);
			expect(result).toBeInstanceOf(Date);
		});

		it("rejects invalid date inputs", async () => {
			await expect(coerceDate.parseAsync("not-a-date")).rejects.toThrow();
			await expect(coerceDate.parseAsync(Number.NaN)).rejects.toThrow();
			await expect(coerceDate.parseAsync({})).rejects.toThrow();
		});
	});
});

describe("ID Validators", () => {
	describe("id", () => {
		it("accepts non-empty strings", async () => {
			const result = await id.parseAsync("some-id");
			expect(result).toBe("some-id");
		});

		it("rejects empty strings", async () => {
			await expect(id.parseAsync("")).rejects.toThrow();
		});
	});

	describe("orgId", () => {
		it("accepts valid UUIDs", async () => {
			const validUuid = "550e8400-e29b-41d4-a716-446655440000";
			const result = await orgId.parseAsync(validUuid);
			expect(result).toBe(validUuid);
		});

		it("rejects invalid UUIDs", async () => {
			await expect(orgId.parseAsync("not-a-uuid")).rejects.toThrow();
		});
	});

	describe("userId", () => {
		it("accepts valid UUIDs", async () => {
			const validUuid = "550e8400-e29b-41d4-a716-446655440000";
			const result = await userId.parseAsync(validUuid);
			expect(result).toBe(validUuid);
		});
	});

	describe("eventId", () => {
		it("accepts valid UUIDs", async () => {
			const validUuid = "550e8400-e29b-41d4-a716-446655440000";
			const result = await eventId.parseAsync(validUuid);
			expect(result).toBe(validUuid);
		});
	});

	describe("postId", () => {
		it("accepts valid UUIDs", async () => {
			const validUuid = "550e8400-e29b-41d4-a716-446655440000";
			const result = await postId.parseAsync(validUuid);
			expect(result).toBe(validUuid);
		});
	});
});

describe("Enums", () => {
	describe("sortOrder", () => {
		it('accepts "asc"', async () => {
			const result = await sortOrder.parseAsync("asc");
			expect(result).toBe("asc");
		});

		it('accepts "desc"', async () => {
			const result = await sortOrder.parseAsync("desc");
			expect(result).toBe("desc");
		});

		it("rejects invalid values", async () => {
			await expect(sortOrder.parseAsync("invalid")).rejects.toThrow();
		});
	});

	describe("postSort", () => {
		it('accepts "NEW"', async () => {
			const result = await postSort.parseAsync("NEW");
			expect(result).toBe("NEW");
		});

		it('accepts "TOP"', async () => {
			const result = await postSort.parseAsync("TOP");
			expect(result).toBe("TOP");
		});

		it("rejects invalid values", async () => {
			await expect(postSort.parseAsync("LATEST")).rejects.toThrow();
		});
	});
});

describe("Pagination", () => {
	it("provides default values", async () => {
		const result = await pagination.parseAsync({});
		expect(result.limit).toBe(20);
		expect(result.cursor).toBeNull();
	});

	it("accepts custom limit within bounds", async () => {
		const result = await pagination.parseAsync({ limit: 50 });
		expect(result.limit).toBe(50);
	});

	it("coerces string limit to number", async () => {
		const result = await pagination.parseAsync({ limit: "50" });
		expect(result.limit).toBe(50);
		expect(typeof result.limit).toBe("number");
	});

	it("accepts cursor as string", async () => {
		const result = await pagination.parseAsync({ cursor: "abc123" });
		expect(result.cursor).toBe("abc123");
	});

	it("converts undefined cursor to null", async () => {
		const result = await pagination.parseAsync({ cursor: undefined });
		expect(result.cursor).toBeNull();
	});

	it("rejects limit below minimum (1)", async () => {
		await expect(pagination.parseAsync({ limit: 0 })).rejects.toThrow(
			"limit must be >= 1",
		);
	});

	it("rejects limit above maximum (100)", async () => {
		await expect(pagination.parseAsync({ limit: 101 })).rejects.toThrow(
			"limit must be <= 100",
		);
	});

	it("rejects non-integer limits", async () => {
		await expect(pagination.parseAsync({ limit: 20.5 })).rejects.toThrow(
			"limit must be an integer",
		);
	});
});

describe("Common Input Shapes", () => {
	describe("organizationIdArg", () => {
		it("accepts valid UUID as id", async () => {
			const validUuid = "550e8400-e29b-41d4-a716-446655440000";
			const result = await organizationIdArg.parseAsync({ id: validUuid });
			expect(result.id).toBe(validUuid);
		});

		it("rejects invalid UUID", async () => {
			await expect(
				organizationIdArg.parseAsync({ id: "not-a-uuid" }),
			).rejects.toThrow();
		});
	});
});

describe("Example Input Schemas", () => {
	describe("createPostInput", () => {
		it("accepts valid post data", async () => {
			const validData = {
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
				title: "Test Post",
			};
			const result = await createPostInput.parseAsync(validData);
			expect(result.organizationId).toBe(validData.organizationId);
			expect(result.title).toBe("Test Post");
			expect(result.body).toBe(""); // default
			expect(result.tags).toEqual([]); // default
			expect(result.visibility).toBe("public"); // default
		});

		it("accepts optional fields", async () => {
			const validData = {
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
				title: "Test Post",
				body: "Post body",
				tags: ["tag1", "tag2"],
				visibility: "private" as const,
			};
			const result = await createPostInput.parseAsync(validData);
			expect(result.body).toBe("Post body");
			expect(result.tags).toEqual(["tag1", "tag2"]);
			expect(result.visibility).toBe("private");
		});

		it("rejects title exceeding max length", async () => {
			const longTitle = "a".repeat(201);
			await expect(
				createPostInput.parseAsync({
					organizationId: "550e8400-e29b-41d4-a716-446655440000",
					title: longTitle,
				}),
			).rejects.toThrow("Title too long");
		});

		it("rejects body exceeding max length", async () => {
			const longBody = "a".repeat(10_001);
			await expect(
				createPostInput.parseAsync({
					organizationId: "550e8400-e29b-41d4-a716-446655440000",
					title: "Test",
					body: longBody,
				}),
			).rejects.toThrow("Body too long");
		});

		it("rejects too many tags", async () => {
			const tooManyTags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
			await expect(
				createPostInput.parseAsync({
					organizationId: "550e8400-e29b-41d4-a716-446655440000",
					title: "Test",
					tags: tooManyTags,
				}),
			).rejects.toThrow();
		});
	});

	describe("eventRangeInput", () => {
		it("accepts valid event range data", async () => {
			const validData = {
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			};
			const result = await eventRangeInput.parseAsync(validData);
			expect(result.organizationId).toBe(validData.organizationId);
			expect(result.onlyPublic).toBe(false); // default
		});

		it("accepts optional date filters", async () => {
			const validData = {
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
				from: "2024-01-15T10:30:00Z",
				to: "2024-01-20T10:30:00Z",
				onlyPublic: true,
			};
			const result = await eventRangeInput.parseAsync(validData);
			expect(result.from).toBe("2024-01-15T10:30:00Z");
			expect(result.to).toBe("2024-01-20T10:30:00Z");
			expect(result.onlyPublic).toBe(true);
		});

		it("rejects invalid datetime format", async () => {
			await expect(
				eventRangeInput.parseAsync({
					organizationId: "550e8400-e29b-41d4-a716-446655440000",
					from: "2024-01-15", // date only, not datetime
				}),
			).rejects.toThrow();
		});
	});
});
