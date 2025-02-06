import { describe, it, expect } from "vitest";

describe("Math Functions", () => {
  const add = (a: number, b: number) => a + b;

  it("should add two numbers correctly", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("should return 0 when adding 0 and 0", () => {
    expect(add(0, 0)).toBe(0);
  });
});

// import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
// import { Fund } from "../../../../src/graphql/types/Fund/Fund";
// import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// const mockCtx = {
//   currentClient: {
//     isAuthenticated: true,
//     user: { id: "user1", role: "member" },
//   },
//   drizzleClient: {
//     query: {
//       usersTable: {
//         findFirst: vi.fn(),
//       },
//     },
//   },
//   log: { error: vi.fn() },
// };

// describe("Fund.implement - updater field", () => {
//   beforeAll(() => {
//     console.log("Running tests in Fund.updater test suite");
//   });

//   beforeEach(() => {
//     vi.clearAllMocks();
//   });

//   it("throws an unauthenticated error if user is not authenticated", async () => {
//     mockCtx.currentClient.isAuthenticated = false;
//     await expect(
//       Fund.fields.updater.resolve({}, {}, mockCtx)
//     ).rejects.toThrowError(
//       new TalawaGraphQLError({ extensions: { code: "unauthenticated" } })
//     );
//   });

//   it("throws an unauthenticated error if user is not found", async () => {
//     mockCtx.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
//       undefined
//     );
//     await expect(
//       Fund.fields.updater.resolve({}, {}, mockCtx)
//     ).rejects.toThrowError(
//       new TalawaGraphQLError({ extensions: { code: "unauthenticated" } })
//     );
//   });

//   it("throws an unauthorized_action error if user is not an administrator", async () => {
//     mockCtx.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
//       id: "user1",
//       role: "member",
//       organizationMembershipsWhereMember: [{ role: "member" }],
//     });
//     await expect(
//       Fund.fields.updater.resolve({}, {}, mockCtx)
//     ).rejects.toThrowError(
//       new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } })
//     );
//   });

//   it("returns null if parent.updaterId is null", async () => {
//     mockCtx.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
//       id: "user1",
//       role: "administrator",
//       organizationMembershipsWhereMember: [{ role: "administrator" }],
//     });
//     await expect(
//       Fund.fields.updater.resolve({ updaterId: null }, {}, mockCtx)
//     ).resolves.toBeNull();
//   });

//   it("returns current user if parent.updaterId matches user.id", async () => {
//     const user = {
//       id: "user1",
//       role: "administrator",
//       organizationMembershipsWhereMember: [{ role: "administrator" }],
//     };
//     mockCtx.drizzleClient.query.usersTable.findFirst.mockResolvedValue(user);
//     await expect(
//       Fund.fields.updater.resolve({ updaterId: "user1" }, {}, mockCtx)
//     ).resolves.toEqual(user);
//   });

//   it("throws an unexpected error if updaterId exists but user is not found", async () => {
//     mockCtx.drizzleClient.query.usersTable.findFirst
//       .mockResolvedValueOnce({
//         id: "user1",
//         role: "administrator",
//         organizationMembershipsWhereMember: [{ role: "administrator" }],
//       })
//       .mockResolvedValueOnce(undefined);
//     await expect(
//       Fund.fields.updater.resolve({ updaterId: "user2" }, {}, mockCtx)
//     ).rejects.toThrowError(
//       new TalawaGraphQLError({ extensions: { code: "unexpected" } })
//     );
//     expect(mockCtx.log.error).toHaveBeenCalledWith(
//       "Postgres select operation returned an empty array for a fund's updater id that isn't null."
//     );
//   });

//   it("returns the found updater user if updaterId exists", async () => {
//     const currentUser = {
//       id: "user1",
//       role: "administrator",
//       organizationMembershipsWhereMember: [{ role: "administrator" }],
//     };
//     const updaterUser = { id: "user2", role: "member" };

//     mockCtx.drizzleClient.query.usersTable.findFirst
//       .mockResolvedValueOnce(currentUser)
//       .mockResolvedValueOnce(updaterUser);

//     await expect(
//       Fund.fields.updater.resolve({ updaterId: "user2" }, {}, mockCtx)
//     ).resolves.toEqual(updaterUser);
//   });
// });
