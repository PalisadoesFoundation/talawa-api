import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { agendaItemsTable } from "~/src/drizzle/schema";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_agendaItem } from "../documentNodes";

/**
 * Test for output-level HTML escaping in AgendaItem resolver.
 *
 * API Contract: Raw HTML strings are stored in the database as-is.
 * HTML escaping is applied at resolver output time (not at input/storage time).
 * This prevents XSS while avoiding data corruption and double-escaping issues.
 *
 * The AgendaItem resolver in src/graphql/types/AgendaItem/AgendaItem.ts
 * applies escapeHTML() to the name and description fields when resolving.
 */

describe("AgendaItem output-level HTML escaping", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const cleanup of testCleanupFunctions.reverse()) {
			try {
				await cleanup();
			} catch (error) {
				console.error("Cleanup failed:", error);
			}
		}
		testCleanupFunctions.length = 0;
	});

	it("should return HTML-escaped name when raw HTML is stored in database", async () => {
		/**
		 * This test verifies the API contract:
		 * 1. Raw HTML is stored in the database without escaping
		 * 2. The GraphQL resolver applies HTML escaping at output time
		 * 3. Clients receive safe, escaped strings that prevent XSS
		 */

		// Test data: raw HTML that would be dangerous if not escaped
		const rawHtmlName = '<script>alert("XSS")</script>';
		const expectedEscapedName =
			"&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;";

		const rawHtmlDescription = '<img src="x" onerror="alert(1)">';
		const expectedEscapedDescription =
			"&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;";

		// Find an existing agenda item to update with raw HTML
		// This approach avoids needing to set up the full folder/event hierarchy
		const existingItems = await server.drizzleClient
			.select()
			.from(agendaItemsTable)
			.limit(1);

		// Fail explicitly if no agenda items exist - ensures CI alerts when preconditions aren't met
		expect(
			existingItems.length,
			"Test requires at least one existing agenda item in the database. Ensure seed data is present.",
		).toBeGreaterThan(0);

		const testItem = existingItems[0];
		if (!testItem) {
			throw new Error("Test requires at least one existing agenda item");
		}

		// Store the original values for cleanup
		const originalName = testItem.name;
		const originalDescription = testItem.description;

		// Update the item with raw HTML directly in the database
		await server.drizzleClient
			.update(agendaItemsTable)
			.set({
				name: rawHtmlName,
				description: rawHtmlDescription,
			})
			.where(eq(agendaItemsTable.id, testItem.id));

		// Add cleanup to restore original values
		testCleanupFunctions.push(async () => {
			await server.drizzleClient
				.update(agendaItemsTable)
				.set({
					name: originalName,
					description: originalDescription,
				})
				.where(eq(agendaItemsTable.id, testItem.id));
		});

		// Verify the raw HTML is stored in the database (not escaped)
		const storedItem = await server.drizzleClient
			.select()
			.from(agendaItemsTable)
			.where(eq(agendaItemsTable.id, testItem.id))
			.limit(1);

		expect(storedItem[0]?.name).toBe(rawHtmlName);
		expect(storedItem[0]?.description).toBe(rawHtmlDescription);

		// Query through GraphQL and verify the resolver escapes the output
		const result = await mercuriusClient.query(Query_agendaItem, {
			variables: {
				input: {
					id: testItem.id,
				},
			},
		});

		// The GraphQL resolver should return escaped HTML
		expect(result.errors).toBeUndefined();
		expect(result.data?.agendaItem).toBeDefined();
		expect(result.data?.agendaItem?.name).toBe(expectedEscapedName);
		expect(result.data?.agendaItem?.description).toBe(
			expectedEscapedDescription,
		);
	});

	it("should handle ampersand escaping correctly", async () => {
		/**
		 * Test that common characters like ampersands are properly escaped.
		 * This is important for content like "Q&A" which should become "Q&amp;A"
		 */

		const rawContent = "Tom & Jerry <3 Programming";
		const expectedEscaped = "Tom &amp; Jerry &lt;3 Programming";

		const existingItems = await server.drizzleClient
			.select()
			.from(agendaItemsTable)
			.limit(1);

		// Fail explicitly if no agenda items exist - ensures CI alerts when preconditions aren't met
		expect(
			existingItems.length,
			"Test requires at least one existing agenda item in the database. Ensure seed data is present.",
		).toBeGreaterThan(0);

		const testItem = existingItems[0];
		if (!testItem) {
			throw new Error("Test requires at least one existing agenda item");
		}

		const originalName = testItem.name;

		await server.drizzleClient
			.update(agendaItemsTable)
			.set({ name: rawContent })
			.where(eq(agendaItemsTable.id, testItem.id));

		testCleanupFunctions.push(async () => {
			await server.drizzleClient
				.update(agendaItemsTable)
				.set({ name: originalName })
				.where(eq(agendaItemsTable.id, testItem.id));
		});

		const result = await mercuriusClient.query(Query_agendaItem, {
			variables: {
				input: {
					id: testItem.id,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.agendaItem?.name).toBe(expectedEscaped);
	});
});
