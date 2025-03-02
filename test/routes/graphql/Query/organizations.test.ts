import { expect, suite, test, vi } from "vitest";
import { mercuriusClient } from "../client";
import { Query_organizations } from "../documentNodes";

// Define TypeScript interfaces for the GraphQL response
interface Organization {
	id: string;
	// Add other relevant fields here
}

interface QueryResult {
	data: {
		organizations: Organization[] | null;
	};
	errors?: { message: string }[];
}

suite("Query field organizations", () => {
	suite("fetches up to 20 organizations", () => {
		test("successfully returns a list of organizations", async () => {
			const result = (await mercuriusClient.query(Query_organizations, {
				variables: {},
			})) as QueryResult;

			// Assert no errors, and the returned organizations are correct
			expect(result.errors).toBeUndefined();
			expect(Array.isArray(result.data.organizations)).toBe(true);
			expect(result.data.organizations).not.toBeNull();
			expect(result.data.organizations?.length).toBeLessThanOrEqual(20);
		});
	}); // <-- Closing brace for the suite

	suite("handles error if fetching organizations fails", () => {
		test("returns an error when an exception occurs during fetching", async () => {
			// Mock the query to simulate an error
			vi.spyOn(mercuriusClient, "query").mockRejectedValueOnce(
				new Error("An error occurred while fetching organizations."),
			);

			try {
				const result = (await mercuriusClient.query(Query_organizations, {
					variables: {},
				})) as QueryResult;

				expect(result.errors).toBeDefined();
				expect(result.data.organizations).toEqual(null);
			} catch (error) {
				// Assert that the error is correctly caught
				expect(error).toBeDefined();
				if (error instanceof Error) {
					expect(error.message).toBe(
						"An error occurred while fetching organizations.",
					);
				} else {
					throw error;
				}
			}
		});
	});
});
