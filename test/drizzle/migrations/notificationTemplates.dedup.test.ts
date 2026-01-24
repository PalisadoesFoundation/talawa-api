import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { server } from "../../server";

describe("notification_templates migration deduplication", () => {
	beforeEach(async () => {
		// Ensure a clean slate and remove index if present
		await server.drizzleClient.execute(
			sql`DROP INDEX IF EXISTS "notification_templates_event_type_channel_type_index"`,
		);
		await server.drizzleClient.execute(
			sql`DELETE FROM "notification_templates"`,
		);
	});

	afterEach(async () => {
		await server.drizzleClient.execute(
			sql`DROP INDEX IF EXISTS "notification_templates_event_type_channel_type_index"`,
		);
		await server.drizzleClient.execute(
			sql`DELETE FROM "notification_templates"`,
		);
	});

	it("deduplicates by created_at then id and enforces unique index", async () => {
		const pair1CreatedAt = "2024-01-01T00:00:00.000Z";
		const pair1Later = "2024-01-02T00:00:00.000Z";
		const pair2CreatedAt = "2024-02-01T00:00:00.000Z";

		// Insert duplicates for (event_type, channel_type) = (event_a, in_app)
		await server.drizzleClient.execute(sql`
			INSERT INTO "notification_templates"
				(id, name, event_type, title, body, channel_type, created_at)
			VALUES
				('00000000-0000-0000-0000-000000000001', 'A1', 'event_a', 't', 'b', 'in_app', ${pair1CreatedAt}),
				('00000000-0000-0000-0000-000000000002', 'A2', 'event_a', 't', 'b', 'in_app', ${pair1Later})
		`);

		// Insert duplicates for (event_type, channel_type) = (event_b, email) with same created_at
		await server.drizzleClient.execute(sql`
			INSERT INTO "notification_templates"
				(id, name, event_type, title, body, channel_type, created_at)
			VALUES
				('00000000-0000-0000-0000-000000000010', 'B1', 'event_b', 't', 'b', 'email', ${pair2CreatedAt}),
				('00000000-0000-0000-0000-000000000011', 'B2', 'event_b', 't', 'b', 'email', ${pair2CreatedAt})
		`);

		// Apply migration steps: dedup then create unique index
		await server.drizzleClient.execute(sql`
			WITH ranked AS (
				SELECT
					id,
					ROW_NUMBER() OVER (
						PARTITION BY event_type, channel_type
						ORDER BY created_at ASC NULLS FIRST, id ASC
					) AS rn
				FROM "notification_templates"
			)
			DELETE FROM "notification_templates" AS nt
			USING ranked
			WHERE nt.id = ranked.id
				AND ranked.rn > 1
		`);

		await server.drizzleClient.execute(sql`
			CREATE UNIQUE INDEX "notification_templates_event_type_channel_type_index"
				ON "notification_templates" USING btree ("event_type","channel_type")
		`);

		// Verify only one row per pair remains
		const countsResult = await server.drizzleClient.execute(sql`
			SELECT event_type, channel_type, COUNT(*) AS cnt
			FROM "notification_templates"
			GROUP BY event_type, channel_type
		`);

		const countRows = countsResult as unknown as Array<{
			event_type: string;
			channel_type: string;
			cnt: bigint | number | string;
		}>;

		for (const row of countRows) {
			const count = typeof row.cnt === "bigint" ? row.cnt : BigInt(row.cnt);
			expect(count).toBe(BigInt(1));
		}

		// Verify the survivor is the earliest created_at, tie broken by lowest id
		const survivorsResult = await server.drizzleClient.execute(sql`
			SELECT id, event_type, channel_type, created_at
			FROM "notification_templates"
			ORDER BY event_type, channel_type, created_at ASC, id ASC
		`);

		const survivorRows = survivorsResult as unknown as Array<{
			id: string;
			event_type: string;
			channel_type: string;
		}>;

		expect(
			survivorRows.find(
				(row) => row.event_type === "event_a" && row.channel_type === "in_app",
			)?.id,
		).toBe("00000000-0000-0000-0000-000000000001");

		expect(
			survivorRows.find(
				(row) => row.event_type === "event_b" && row.channel_type === "email",
			)?.id,
		).toBe("00000000-0000-0000-0000-000000000010");

		// Verify unique index enforcement
		await expect(
			server.drizzleClient.execute(sql`
				INSERT INTO "notification_templates"
					(id, name, event_type, title, body, channel_type, created_at)
				VALUES
					('00000000-0000-0000-0000-000000000099', 'A3', 'event_a', 't', 'b', 'in_app', NOW())
			`),
		).rejects.toThrow();
	});

	it("aborts migration if duplicates exist before dedup step", async () => {
		await server.drizzleClient.execute(sql`
			INSERT INTO "notification_templates"
				(id, name, event_type, title, body, channel_type, created_at)
			VALUES
				('00000000-0000-0000-0000-000000000101', 'D1', 'event_dup', 't', 'b', 'in_app', '2024-03-01T00:00:00.000Z'),
				('00000000-0000-0000-0000-000000000102', 'D2', 'event_dup', 't', 'b', 'in_app', '2024-03-02T00:00:00.000Z')
		`);

		await expect(
			server.drizzleClient.execute(sql`
				DO $$
				DECLARE
				  duplicate_pairs_count integer;
				BEGIN
				  SELECT COUNT(*)
				  INTO duplicate_pairs_count
				  FROM (
				    SELECT event_type, channel_type
				    FROM "notification_templates"
				    GROUP BY event_type, channel_type
				    HAVING COUNT(*) > 1
				  ) AS duplicate_pairs;

				  IF duplicate_pairs_count > 0 THEN
				    RAISE EXCEPTION
				      'Found % duplicate (event_type, channel_type) pairs in notification_templates.',
				      duplicate_pairs_count;
				  END IF;
				END $$;
			`),
		).rejects.toThrow(
			"Found 1 duplicate (event_type, channel_type) pairs in notification_templates.",
		);
	});
});
