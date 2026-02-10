import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, expect, suite, test, vi } from "vitest";
import { mobilePhoneNumberResolver } from "~/src/graphql/types/User/mobilePhoneNumber";
import type { User as UserType } from "~/src/graphql/types/User/User";
import {
    TalawaGraphQLError,
} from "~/src/utilities/TalawaGraphQLError";

suite("User field mobilePhoneNumber - Unit Tests", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("throws unauthenticated error when client is not authenticated for unit test", async () => {
        const userId = faker.string.uuid();
        const { context } = createMockGraphQLContext(false);

        const parent = {
            id: userId,
            mobilePhoneNumber: "1234567890",
        } as unknown as UserType;

        await expect(
            mobilePhoneNumberResolver(parent, {}, context),
        ).rejects.toThrow();

        await expect(mobilePhoneNumberResolver(parent, {}, context)).rejects.toMatchObject({
            extensions: {
                code: "unauthenticated",
            },
        });
    });

    test("throws unauthenticated error when current user is not found in DB", async () => {
        const userId = faker.string.uuid();
        const { context, mocks } = createMockGraphQLContext(true, userId);

        const parent = {
            id: userId,
            mobilePhoneNumber: "1234567890",
        } as unknown as UserType;

        mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

        await expect(
            mobilePhoneNumberResolver(parent, {}, context),
        ).rejects.toMatchObject({
            extensions: {
                code: "unauthenticated",
            },
        });
    });

    test("throws unauthorized_action error when user is not admin and accessing another user's data", async () => {
        const currentUserId = faker.string.uuid();
        const otherUserId = faker.string.uuid();
        const { context, mocks } = createMockGraphQLContext(true, currentUserId);

        const parent = {
            id: otherUserId,
            mobilePhoneNumber: "1234567890",
        } as unknown as UserType;

        mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
            role: "regular",
        });

        await expect(
            mobilePhoneNumberResolver(parent, {}, context),
        ).rejects.toMatchObject({
            extensions: {
                code: "unauthorized_action",
            },
        });
    });

    test("returns mobilePhoneNumber when user is admin accessing another user's data", async () => {
        const currentUserId = faker.string.uuid();
        const otherUserId = faker.string.uuid();
        const { context, mocks } = createMockGraphQLContext(true, currentUserId);
        const expectedPhoneNumber = "1234567890";

        const parent = {
            id: otherUserId,
            mobilePhoneNumber: expectedPhoneNumber,
        } as unknown as UserType;

        mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
            role: "administrator",
        });

        const result = await mobilePhoneNumberResolver(parent, {}, context);
        expect(result).toBe(expectedPhoneNumber);
    });

    test("returns mobilePhoneNumber when user is accessing their own data (even if not admin)", async () => {
        const currentUserId = faker.string.uuid();
        const { context, mocks } = createMockGraphQLContext(true, currentUserId);
        const expectedPhoneNumber = "1234567890";

        const parent = {
            id: currentUserId,
            mobilePhoneNumber: expectedPhoneNumber,
        } as unknown as UserType;

        mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
            role: "regular",
        });

        const result = await mobilePhoneNumberResolver(parent, {}, context);
        expect(result).toBe(expectedPhoneNumber);
    });

    test("handles null or empty mobilePhoneNumber correctly", async () => {
        const userId = faker.string.uuid();
        const { context, mocks } = createMockGraphQLContext(true, userId);

        const parentNull = {
            id: userId,
            mobilePhoneNumber: null,
        } as unknown as UserType;

        const parentEmpty = {
            id: userId,
            mobilePhoneNumber: "",
        } as unknown as UserType;

        mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
            role: "regular",
        });

        const resultNull = await mobilePhoneNumberResolver(
            parentNull,
            {},
            context,
        );
        const resultEmpty = await mobilePhoneNumberResolver(
            parentEmpty,
            {},
            context,
        );

        expect(resultNull).toBeNull();
        expect(resultEmpty).toBe("");
    });

    test("wraps generic Error in Internal Server Error", async () => {
        const userId = faker.string.uuid();
        const { context, mocks } = createMockGraphQLContext(true, userId);

        const parent = {
            id: userId,
        } as unknown as UserType;

        const genericError = new Error("Something went wrong");
        mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
            genericError,
        );

        await expect(
            mobilePhoneNumberResolver(parent, {}, context),
        ).rejects.toThrow("Internal server error");
    });

    test("rethrows TalawaGraphQLError as is", async () => {
        const userId = faker.string.uuid();
        const { context, mocks } = createMockGraphQLContext(true, userId);

        const parent = {
            id: userId,
        } as unknown as UserType;

        const talawaError = new TalawaGraphQLError({
            message: "Custom error",
            extensions: { code: "unauthenticated" },
        });
        mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
            talawaError,
        );

        await expect(
            mobilePhoneNumberResolver(parent, {}, context),
        ).rejects.toThrow(talawaError);
    });
});
