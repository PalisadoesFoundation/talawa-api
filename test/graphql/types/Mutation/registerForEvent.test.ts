import { test, expect } from "vitest";
// Update the import path if the builder module is located elsewhere, for example:
import { registerForEventResolver } from "~/src/graphql/types/Mutation/registerForEvent";
// Example alternative:
// import { builder } from "../../../src/builder";
// import { builder } from "../../../../../src/graphql/builder";

// Mock context and dependencies as needed
const mockCtx = {
    currentClient: {
        isAuthenticated: true,
        user: { id: "user-1" },
    },
    drizzleClient: {
        transaction: async (fn: any) => fn({
            execute: async () => [{ isRegisterable: true, capacity: 2 }],
            select: () => ({
                from: () => ({
                    where: () => []
                })
            }),
            insert: () => ({
                values: () => ({
                    returning: () => [{ eventId: "event-1", attendeeId: "user-1", creatorId: "user-1" }]
                })
            }),
        }),
    },
};


test("registerForEvent: successful registration", async () => {
    const args = { input: { eventId: "event-1" } };
    const result = await registerForEventResolver(null, args, mockCtx);
    expect(result).toMatchObject({ eventId: "event-1", attendeeId: "user-1", creatorId: "user-1" });
});

test("registerForEvent: missing eventId", async () => {
    const args = { input: {} };
    await expect(
        registerForEventResolver(null, args, mockCtx)
    ).rejects.toThrow("You have provided invalid arguments for this action.");
});

test("registerForEvent: unauthenticated user", async () => {
    const unauthCtx = { ...mockCtx, currentClient: { isAuthenticated: false, user: { id: "user-1" } } };
    const args = { input: { eventId: "event-1" } };
    await expect(
        registerForEventResolver(null, args, unauthCtx)
    ).rejects.toThrow();
});
