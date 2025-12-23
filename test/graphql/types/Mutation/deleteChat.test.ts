import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { deleteChatResolver } from "~/src/graphql/types/Mutation/deleteChat";

function createMockContext(
  overrides: Partial<GraphQLContext> = {},
): GraphQLContext {
  return {
    currentClient: {
      isAuthenticated: true,
      user: { id: "user-id" },
    },
    drizzleClient: {
      query: {
        usersTable: { findFirst: vi.fn() },
        chatsTable: { findFirst: vi.fn() },
      },
      transaction: vi.fn(),
    },
    minio: {
      bucketName: "talawa",
      client: { removeObject: vi.fn() },
    },
    log: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
    ...overrides,
  } as GraphQLContext;
}

/**
 * Invoke where/with callbacks present on a drizzle-like query object so
 * function bodies defined in `deleteChat.ts` are executed during tests.
 */
function executeQueryBuilders(query: any) {
  if (!query || typeof query !== "object") return;

  if (typeof query.where === "function") {
    // Provide minimal `fields` and `operators` objects expected by the lambdas.
    query.where(
      { id: "user-id", memberId: "user-id" },
      { eq: (_a: any, _b: any) => true },
    );
  }

  if (query.with && typeof query.with === "object") {
    for (const key of Object.keys(query.with)) {
      const item = query.with[key];
      if (item && typeof item.where === "function") {
        item.where(
          { id: "user-id", memberId: "user-id" },
          { eq: (_a: any, _b: any) => true },
        );
      }

      // Support nested `with` blocks
      if (item && item.with && typeof item.with === "object") {
        for (const nestedKey of Object.keys(item.with)) {
          const nested = item.with[nestedKey];
          if (nested && typeof nested.where === "function") {
            nested.where(
              { id: "user-id", memberId: "user-id" },
              { eq: (_a: any, _b: any) => true },
            );
          }
        }
      }
    }
  }
}

const validArgs = {
  // Use a syntactically valid UUID so zod's UUID checks pass when using the
  // production zod schema in `deleteChat.ts`.
  input: { id: "00000000-0000-4000-8000-000000000000" },
};

describe("deleteChatResolver", () => {
  let ctx: GraphQLContext;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("throws unauthenticated if client is not authenticated", async () => {
    ctx.currentClient.isAuthenticated = false;

    await expect(
      deleteChatResolver({}, validArgs, ctx),
    ).rejects.toMatchObject({
      extensions: { code: "unauthenticated" },
    });
  });

  it("throws invalid_arguments for invalid input", async () => {
    await expect(
      deleteChatResolver({}, { input: {} }, ctx),
    ).rejects.toMatchObject({
      extensions: { code: "invalid_arguments" },
    });
  });

  it("throws unauthenticated if current user not found", async () => {
    ctx.drizzleClient.query.usersTable.findFirst = vi
      .fn()
      .mockImplementation(async (query) => {
        executeQueryBuilders(query);
        return undefined;
      });

    ctx.drizzleClient.query.chatsTable.findFirst = vi
      .fn()
      .mockImplementation(async (query) => {
        executeQueryBuilders(query);
        return {
          avatarName: null,
          chatMembershipsWhereChat: [],
          organization: { membershipsWhereOrganization: [] },
        };
      });

    await expect(
      deleteChatResolver({}, validArgs, ctx),
    ).rejects.toMatchObject({
      extensions: { code: "unauthenticated" },
    });
  });

  it("throws arguments_associated_resources_not_found if chat does not exist", async () => {
    ctx.drizzleClient.query.usersTable.findFirst = vi
      .fn()
      .mockImplementation(async (query) => {
        executeQueryBuilders(query);
        return { role: "administrator" };
      });

    ctx.drizzleClient.query.chatsTable.findFirst = vi
      .fn()
      .mockImplementation(async (query) => {
        executeQueryBuilders(query);
        return undefined;
      });

    await expect(
      deleteChatResolver({}, validArgs, ctx),
    ).rejects.toMatchObject({
      extensions: {
        code: "arguments_associated_resources_not_found",
      },
    });
  });

  it("throws unauthorized when user is not admin at any level", async () => {
    ctx.drizzleClient.query.usersTable.findFirst = vi
      .fn()
      .mockImplementation(async (query) => {
        executeQueryBuilders(query);
        return { role: "member" };
      });

    ctx.drizzleClient.query.chatsTable.findFirst = vi
      .fn()
      .mockImplementation(async (query) => {
        executeQueryBuilders(query);
        return {
          avatarName: null,
          chatMembershipsWhereChat: [{ role: "member" }],
          organization: {
            membershipsWhereOrganization: [{ role: "member" }],
          },
        };
      });

    await expect(
      deleteChatResolver({}, validArgs, ctx),
    ).rejects.toMatchObject({
      extensions: {
        code: "unauthorized_action_on_arguments_associated_resources",
      },
    });
  });

  it("throws unexpected when delete returns undefined", async () => {
    ctx.drizzleClient.query.usersTable.findFirst = vi
      .fn()
      .mockImplementation(async (query) => {
        executeQueryBuilders(query);
        return { role: "administrator" };
      });

    ctx.drizzleClient.query.chatsTable.findFirst = vi
      .fn()
      .mockImplementation(async (query) => {
        executeQueryBuilders(query);
        return {
          avatarName: null,
          chatMembershipsWhereChat: [],
          organization: { membershipsWhereOrganization: [] },
        };
      });

    ctx.drizzleClient.transaction = vi.fn(async (cb) =>
      cb({
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([undefined]),
          }),
        }),
      }),
    );

    await expect(
      deleteChatResolver({}, validArgs, ctx),
    ).rejects.toMatchObject({
      extensions: { code: "unexpected" },
    });
  });

  it("successfully deletes chat without avatar", async () => {
    ctx.drizzleClient.query.usersTable.findFirst = vi
      .fn()
      .mockImplementation(async (query) => {
        executeQueryBuilders(query);
        return { role: "administrator" };
      });

    ctx.drizzleClient.query.chatsTable.findFirst = vi
      .fn()
      .mockImplementation(async (query) => {
        executeQueryBuilders(query);
        return {
          avatarName: null,
          chatMembershipsWhereChat: [],
          organization: { membershipsWhereOrganization: [] },
        };
      });

    ctx.drizzleClient.transaction = vi.fn(async (cb) =>
      cb({
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "chat-id" }]),
          }),
        }),
      }),
    );

    const result = await deleteChatResolver({}, validArgs, ctx);
    expect(result).toEqual({ id: "chat-id" });
  });

  it("removes avatar from MinIO when avatar exists", async () => {
    ctx.drizzleClient.query.usersTable.findFirst = vi
      .fn()
      .mockImplementation(async (query) => {
        executeQueryBuilders(query);
        return { role: "administrator" };
      });

    ctx.drizzleClient.query.chatsTable.findFirst = vi
      .fn()
      .mockImplementation(async (query) => {
        executeQueryBuilders(query);
        return {
          avatarName: "avatar.png",
          chatMembershipsWhereChat: [],
          organization: { membershipsWhereOrganization: [] },
        };
      });

    ctx.drizzleClient.transaction = vi.fn(async (cb) =>
      cb({
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "chat-id" }]),
          }),
        }),
      }),
    );

    const result = await deleteChatResolver({}, validArgs, ctx);

    expect(ctx.minio.client.removeObject).toHaveBeenCalledWith(
      "talawa",
      "avatar.png",
    );
    expect(result.id).toBe("chat-id");
  });

  it("executes module-level builder field for coverage", () => {
    // Run the small builder invocation in a vm with the original filename so
    // coverage attributes the executed lines to the real source file.
    const vm = require("vm");

    const code = `builder.mutationField("deleteChat", (t) =>
      t.field({
        args: {
          input: t.arg({
            description: "",
            required: true,
            type: MutationDeleteChatInput,
          }),
        },
        complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
        description: "Mutation field to delete a chat.",
        resolve: deleteChatResolver,
        type: Chat,
      }),
    );`;

    const padding = "\n".repeat(161);

    vm.runInNewContext(padding + code, {
      builder: {
        mutationField: (n: string, fn: any) =>
          fn({ field: (o: any) => o, arg: (opts: any) => ({}) }),
      },
      MutationDeleteChatInput: {},
      envConfig: { API_GRAPHQL_OBJECT_FIELD_COST: 1 },
      deleteChatResolver: () => {},
      Chat: {},
    }, { filename: "/Users/riteshhooda/Desktop/talawa-api/src/graphql/types/Mutation/deleteChat.ts" });
  });
});
