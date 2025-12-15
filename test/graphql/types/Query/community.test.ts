import { faker } from "@faker-js/faker";
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
		const communityId = faker.string.uuid();
		await server.drizzleClient.insert(communitiesTable).values({
			id: communityId,
			name: "Test community",
		});

		const response = await mercuriusClient.query(Query_community);

		expect(response.errors).toBeUndefined();
		expect(response.data?.community).toBeDefined();
		expect(response.data?.community.id).toBe(communityId);
		expect(response.data?.community.name).toBe("Test community");
	});
});
