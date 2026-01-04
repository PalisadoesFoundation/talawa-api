import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";

import { communitiesTable } from "~/src/drizzle/tables/communities";

import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_community } from "../documentNodes";

suite("community query", () => {
	test("returns community when it exists", async () => {
		const communityId = faker.string.uuid();
		await server.drizzleClient.insert(communitiesTable).values({
			id: communityId,
			name: "Test community",
		});

		const response = await mercuriusClient.query(Query_community);

		expect(response.errors).toBeUndefined();
		expect(response.data?.community).toBeDefined();
		expect(response.data?.community?.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
		expect(response.data?.community?.name).toBeDefined();
	});

	test("throws unexpected error when community does not exist", async () => {
		vi.spyOn(
			server.drizzleClient.query.communitiesTable,
			"findFirst",
		).mockResolvedValueOnce(undefined);

		const response = await mercuriusClient.query(Query_community);

		expect(response.errors).toBeDefined();
		expect(response.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unexpected",
					}),
				}),
			]),
		);
	});
});
