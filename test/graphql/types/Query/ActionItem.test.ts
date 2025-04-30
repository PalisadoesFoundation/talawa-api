// tests/actionItemsByOrganization.test.ts
import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, expect, suite, test } from "vitest";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_actionItemsByOrganization,
	Query_signIn,
} from "../documentNodes";

// --- Helpers ---
let globalAuth: { authToken: string; userId: string };

async function globalSignInAndGetToken() {
	const emailAddress = process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
	const password = process.env.API_ADMINISTRATOR_USER_PASSWORD;

	if (!emailAddress || !password) {
		throw new Error(
			"Administrator email or password environment variables are not set",
		);
	}

	const res = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress,
				password,
			},
		},
	});
	assertToBeNonNullish(res.data?.signIn);
	const token = res.data.signIn.authenticationToken;
	const userId = res.data.signIn.user?.id;
	assertToBeNonNullish(token);
	assertToBeNonNullish(userId);
	return { authToken: token, userId };
}

async function createUser(role: "regular" | "administrator" = "regular") {
	const input = {
		name: faker.person.fullName(),
		emailAddress: faker.internet.email(),
		password: faker.internet.password({ length: 12 }),
		role,
		isEmailAddressVerified: true,
		workPhoneNumber: null,
		state: null,
		postalCode: null,
		naturalLanguageCode: "en" as const,
		addressLine1: null,
		addressLine2: null,
	};
	const res = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: { input },
	});
	assertToBeNonNullish(res.data?.createUser);
	return {
		userId: (() => {
			assertToBeNonNullish(res.data.createUser.user);
			return res.data.createUser.user.id;
		})(),
		authToken: (() => {
			const token = res.data.createUser.authenticationToken;
			assertToBeNonNullish(token);
			return token;
		})(),
	};
}

async function createOrganization() {
	const name = `TestOrg ${faker.string.uuid()}`;
	const res = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: {
			input: {
				name,
				description: "for tests",
				countryCode: "us",
				state: "CA",
				city: "SF",
				postalCode: "94101",
				addressLine1: "123 Market St",
				addressLine2: null,
			},
		},
	});
	assertToBeNonNullish(res.data?.createOrganization);
	return res.data.createOrganization.id;
}

async function addMembership(
	orgId: string,
	userId: string,
	role: "regular" | "administrator",
) {
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: { input: { organizationId: orgId, memberId: userId, role } },
	});
}

async function seedActionItem(orgId: string, creatorId: string) {
	const id = faker.string.uuid();
	await server.drizzleClient
		.insert(actionItemsTable)
		.values({
			id,
			preCompletionNotes: "foo",
			postCompletionNotes: "bar",
			isCompleted: faker.datatype.boolean(),
			assignedAt: new Date(),
			completionAt: new Date(),
			actionItemCategoryId: null, // renamed field
			assigneeId: creatorId,
			creatorId,
			organizationId: orgId,
			updaterId: creatorId,
			updatedAt: new Date(),
			eventId: null,
			allottedHours: null,
		})
		.execute();
	return id;
}

// --- Test Suite ---
suite("Query: actionItemsByOrganization", () => {
	const cleanupFns: Array<() => Promise<void>> = [];
	let orgId: string;
	let otherOrgId: string;
	let regular: { authToken: string; userId: string };
	let nonMember: { authToken: string; userId: string };

	beforeAll(async () => {
		globalAuth = await globalSignInAndGetToken();
	});

	beforeEach(async () => {
		// Create two orgs
		orgId = await createOrganization();
		cleanupFns.push(async () => {
			await server.drizzleClient
				.delete(actionItemsTable)
				.where(sql`1 = 0`)
				.execute(); // no-op placeholder
			// you'd call your delete-organization mutation here if available
		});
		otherOrgId = await createOrganization();

		// Create regular + non-member users
		regular = await createUser("regular");
		nonMember = await createUser("regular");

		// Add regular to orgId
		await addMembership(orgId, regular.userId, "regular");

		// Clear any pre-existing items
		await server.drizzleClient
			.delete(actionItemsTable)
			.where(sql`${actionItemsTable.organizationId} = ${orgId}`)
			.execute();

		// Seed one item in orgId
		await seedActionItem(orgId, globalAuth.userId);
	});

	afterEach(async () => {
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch {}
		}
		cleanupFns.length = 0;
	});

	test("unauthenticated if no token", async () => {
		const res = await mercuriusClient.query(Query_actionItemsByOrganization, {
			variables: { input: { organizationId: orgId } },
		});
		expect(res.data?.actionItemsByOrganization).toBeNull();
		expect(res.errors?.[0]?.extensions.code).toBe("unauthenticated");
	});

	test("empty array when no items in other org", async () => {
		const res = await mercuriusClient.query(Query_actionItemsByOrganization, {
			headers: { authorization: `bearer ${regular.authToken}` },
			variables: { input: { organizationId: otherOrgId } },
		});
		expect(res.errors).toBeUndefined();
		expect(res.data?.actionItemsByOrganization).toEqual([]);
	});

	test("unauthorized if user not a member", async () => {
		const res = await mercuriusClient.query(Query_actionItemsByOrganization, {
			headers: { authorization: `bearer ${nonMember.authToken}` },
			variables: { input: { organizationId: orgId } },
		});
		expect(res.data?.actionItemsByOrganization).toBeNull();
		expect(res.errors?.[0]?.extensions.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});
});
