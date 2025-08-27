import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { notificationTemplatesTable } from "~/src/drizzle/tables/NotificationTemplate";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_signIn,
	Query_user_notifications,
} from "../documentNodes";

describe("Notification minimal API flow", () => {
	let adminToken: string;
	let orgId: string | undefined;
	let userId: string | undefined;
	let userToken: string | undefined;

	beforeAll(async () => {
		const signIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		adminToken = signIn.data?.signIn?.authenticationToken as string;
		assertToBeNonNullish(adminToken);

		const template =
			await server.drizzleClient.query.notificationTemplatesTable.findFirst({
				where: (f, o) =>
					o.and(
						o.eq(f.eventType, "post_created"),
						o.eq(f.channelType, "in_app"),
					),
			});
		if (!template) {
			await server.drizzleClient.insert(notificationTemplatesTable).values({
				name: "New Post Created",
				eventType: "post_created",
				title: "New post by {authorName}",
				body: '{authorName} has created a new post in {organizationName}: "{postCaption}"',
				channelType: "in_app",
				linkedRouteName: "/post/{postId}",
			});
		}

		const regular = await createRegularUserUsingAdmin();
		userId = regular.userId;
		userToken = regular.authToken;

		const orgRes = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { name: `Org ${faker.string.uuid()}`, countryCode: "us" },
			},
		});
		orgId = orgRes.data?.createOrganization?.id as string;
		assertToBeNonNullish(orgId);

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: userId as string,
					organizationId: orgId,
					role: "regular",
				},
			},
		});
	});

	afterAll(async () => {
		if (orgId) {
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: orgId } },
				});
			} catch {}
		}
		if (userId) {
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: userId } },
				});
			} catch {}
		}
	});

	test("post_created notification delivered", async () => {
		const postRes = await mercuriusClient.mutate(Mutation_createPost, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					organizationId: orgId as string,
					caption: `Post ${faker.lorem.sentence()}`,
					attachments: [
						{
							mimetype: "IMAGE_PNG",
							objectName: `obj-${faker.string.uuid()}`,
							name: `img-${faker.string.uuid()}.png`,
							fileHash: `hash-${faker.string.uuid()}`,
						},
					],
				},
			},
		});
		expect(postRes.errors).toBeUndefined();

		const start = Date.now();
		let notifications: Array<{ id: string | null; eventType?: string | null }> =
			[];
		while (Date.now() - start < 6000) {
			const res = await mercuriusClient.query(Query_user_notifications, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: { id: userId as string },
					notificationInput: { first: 5 },
				},
			});
			notifications = res.data?.user?.notifications ?? [];
			if (notifications.length) break;
			await new Promise((r) => setTimeout(r, 150));
		}
		expect(notifications.length).toBeGreaterThan(0);
		expect(notifications[0]?.eventType).toBe("post_created");
	});
});
