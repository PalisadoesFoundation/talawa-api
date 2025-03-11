import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mercuriusClient } from "test/routes/graphql/client";
import { drizzleClient } from "~/src/plugins/drizzleClient";
import { chatMessagesTable } from "~/src/drizzle/schema"; // Import the table schema
import { eq } from "drizzle-orm";

const TEST_MESSAGE_ID = "11111111-1111-1111-1111-111111111111";
const TEST_USER_ID = "22222222-2222-2222-2222-222222222222";
const TEST_CHAT_ID = "12345678-1234-1234-1234-123456789012";

async function setupTestData() {
    await drizzleClient.insert(chatMessagesTable).values([
        {
            id: TEST_MESSAGE_ID,
            creatorId: TEST_USER_ID,
            body: "Test message for deletion",
            chatId: TEST_CHAT_ID,
        }
    ]).execute(); // Ensure execution
}

async function cleanupTestData() {
    await drizzleClient.delete(chatMessagesTable).where(eq(chatMessagesTable.id, TEST_MESSAGE_ID)).execute();
}

describe("deleteChatMessage GraphQL Integration Tests", () => {
    beforeEach(async () => {
        await setupTestData();
    });

    afterEach(async () => {
        await cleanupTestData();
    });

    it("successfully deletes a chat message", async () => {
        const result = await mercuriusClient.query(
            `
            mutation {
                deleteChatMessage(input: { id: "${TEST_MESSAGE_ID}" }) {
                    id
                }
            }
        `,
            {
                headers: { Authorization: "Bearer validToken" }, // Replace with a valid token
            },
        );

        expect(result.errors).toBeUndefined();
        expect(result.data?.deleteChatMessage?.id).toBe(TEST_MESSAGE_ID);

        // Verify the message no longer exists in the database
        const checkDeleted = await drizzleClient
            .select()
            .from(chatMessagesTable)
            .where(eq(chatMessagesTable.id, TEST_MESSAGE_ID))
            .execute();

        expect(checkDeleted.length).toBe(0); // Ensure no records exist
    });

    it("returns an error if the message does not exist", async () => {
        const result = await mercuriusClient.query(
            `
            mutation {
                deleteChatMessage(input: { id: "nonexistent-id" }) {
                    id
                }
            }
        `,
            {
                headers: { Authorization: "Bearer validToken" }, // Replace with a valid token
            },
        );

        expect(result.errors).toBeDefined();
        expect(result.errors?.[0]?.extensions?.code).toBe("arguments_associated_resources_not_found");
    });

    it("returns an authentication error for unauthorized users", async () => {
        const result = await mercuriusClient.query(
            `
            mutation {
                deleteChatMessage(input: { id: "${TEST_MESSAGE_ID}" }) {
                    id
                }
            }
        `,
            {
                headers: { Authorization: "Bearer invalidToken" }, // Use an invalid token
            },
        );

        expect(result.errors).toBeDefined();
        expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
    });
});
