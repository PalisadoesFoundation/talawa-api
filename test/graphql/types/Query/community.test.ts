import { gql } from "graphql-tag";
import { expect, suite, test } from "vitest";

import { communitiesTable } from "~/src/drizzle/tables/communities";

import { server } from "../../../server";
import { mercuriusClient } from "../client";

const Query_community = gql(`
	query Query_community {
		community {
			id
			name
		}
	}
`);

suite("community query", () => {
	test("returns community when it exists", async () => {
		await server.drizzleClient.insert(communitiesTable).values({
			id: "test-id",
			name: "Test community",
		});

		const response = await mercuriusClient.query(Query_community);

		expect(response.errors).toBeUndefined();
		expect(response.data?.community).toBeDefined();
		expect(response.data?.community.id).toBe("test-id");
		expect(response.data?.community.name).toBe("Test community");
	});

	test("returns unexpected error when no community exists", async () => {
		const result = await mercuriusClient.query(Query_community);

		expect(result.data?.community ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unexpected" }),
					path: ["community"],
				}),
			]),
		);
	});
});
