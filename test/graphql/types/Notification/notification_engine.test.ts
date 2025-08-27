import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_createUser,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_signIn,
	Query_user_notifications,
} from "../documentNodes";

describe("Notification flow (API level)", () => {
	let adminToken: string | null = null;
	let hasPostCreatedTemplate = false;
	const cleanups: Array<() => Promise<void>> = [];

	beforeAll(async () => {
		const tpl =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (fields, operators) =>
					operators.and(
						operators.eq(fields.eventType, "post_created"),
						operators.eq(fields.channelType, "in_app"),
					),
			});
		hasPostCreatedTemplate = Boolean(tpl);

		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		adminToken = adminRes.data?.signIn?.authenticationToken ?? null;
	});

	afterEach(async () => {
		while (cleanups.length) {
			const fn = cleanups.pop();
			try {
				if (fn) await fn();
			} catch {
			}
		}
	});

	test("creates a post and user receives in-app notification", async () => {
		if (!hasPostCreatedTemplate || !adminToken) return; 

		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `Org ${faker.string.uuid()}`, countryCode: "us" },
			},
		});
		const orgId = orgRes.data?.createOrganization?.id as string;
		expect(orgId).toBeTruthy();
		cleanups.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		const userPassword = faker.internet.password();
		const createUserRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: faker.person.fullName(),
					emailAddress: faker.internet.email(),
					password: userPassword,
					role: "regular",
					isEmailAddressVerified: true,
				},
			},
		});
		const user = createUserRes.data?.createUser?.user;
		expect(user?.id).toBeTruthy();
		cleanups.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: user?.id as string } },
			});
		});

		const userSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: user?.emailAddress as string,
					password: userPassword,
				},
			},
		});
		const userToken = userSignIn.data?.signIn?.authenticationToken as string;
		expect(userToken).toBeTruthy();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: user?.id as string,
					organizationId: orgId,
					role: "regular",
				},
			},
		});

		const postRes = await mercuriusClient.mutate(Mutation_createPost, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					organizationId: orgId,
					caption: `Test post ${faker.lorem.sentence()}`,
					attachments: [
						{
							mimetype: "IMAGE_PNG",
							objectName: `test-object-${faker.string.uuid()}`,
							name: `test-image-${faker.string.uuid()}.png`,
							fileHash: `test-file-hash-${faker.string.uuid()}`,
						},
					],
				},
			},
		});
		expect(postRes.errors).toBeUndefined();

		const start = Date.now();
		let notifications: Array<{ id: string | null }> = [];
		while (Date.now() - start < 10000) {
			const notifRes = await mercuriusClient.query(Query_user_notifications, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: { id: user?.id as string },
					notificationInput: { first: 10 },
				},
			});
			notifications = notifRes.data?.user?.notifications ?? [];
			if (notifications.length > 0) break;
			await new Promise((r) => setTimeout(r, 150));
		}
		expect(notifications.length > 0).toBe(true);
	});
});
