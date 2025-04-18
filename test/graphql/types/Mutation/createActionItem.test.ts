import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createActionItem,
	Mutation_createActionItemCategory,
	Mutation_createOrganization,
	Mutation_joinPublicOrganization,
	Query_signIn,
} from "../documentNodes";

// 1. Sign in as administrator to get auth token
const signInRes = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(signInRes.data?.signIn);
const adminToken = signInRes.data.signIn.authenticationToken;
assertToBeNonNullish(adminToken);

suite("Mutation createActionItem", () => {
	const makeInput = (
		overrides: Partial<{
			organizationId: string;
			categoryId: string;
			assigneeId: string;
			assignedAt: string;
			eventId?: string;
			preCompletionNotes?: string;
		}> = {},
	) => ({
		input: {
			organizationId: overrides.organizationId ?? faker.string.uuid(),
			categoryId: overrides.categoryId ?? faker.string.uuid(),
			assigneeId: overrides.assigneeId ?? faker.string.uuid(),
			assignedAt: overrides.assignedAt ?? new Date().toISOString(),
			eventId: overrides.eventId,
			preCompletionNotes: overrides.preCompletionNotes,
		},
	});

	suite("unauthenticated", () => {
		test("returns unauthenticated error", async () => {
			const res = await mercuriusClient.mutate(Mutation_createActionItem, {
				variables: makeInput(),
			});

			expect(res.data?.createActionItem).toBeNull();
			expect(res.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createActionItem"],
					}),
				]),
			);
		});
	});

	suite("invalid arguments", () => {
		test("bad UUIDs", async () => {
			const res = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId: "not-a-uuid",
						categoryId: "also-bad-uuid",
						assigneeId: "nope",
						assignedAt: "invalid-date",
					},
				},
			});

			expect(res.data?.createActionItem).toBeNull();
			expect(res.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["createActionItem"],
					}),
				]),
			);
		});
	});

	suite("resource‐not‐found checks", () => {
		test("organization missing", async () => {
			const res = await mercuriusClient.mutate(Mutation_createActionItem, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: makeInput({ organizationId: faker.string.uuid() }),
			});

			expect(res.data?.createActionItem).toBeNull();
			expect(res.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["createActionItem"],
					}),
				]),
			);
		});
	});
});
