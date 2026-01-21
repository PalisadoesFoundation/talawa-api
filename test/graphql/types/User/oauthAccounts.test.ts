import { initGraphQLTada } from "gql.tada";
import { expect, suite, test } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_signIn } from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Query_UserOAuthAccounts = gql(`
  query UserOAuthAccounts($input: QueryUserInput!) {
    user(input: $input) {
      oauthAccounts {
        provider
        email
        linkedAt
        lastUsedAt
      }
    }
  }
`);

suite("User field oauthAccounts", () => {
	test("returns empty array for authenticated user", async () => {
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const adminToken = adminRes.data?.signIn?.authenticationToken;
		assertToBeNonNullish(adminToken);

		const adminUserId = adminRes.data.signIn?.user?.id;
		assertToBeNonNullish(adminUserId);

		const res = await mercuriusClient.query(Query_UserOAuthAccounts, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					id: adminUserId,
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data.user?.oauthAccounts).toEqual([]);
	});
});
