import { describe, it, expect, afterEach } from "vitest";
import { updateVenue } from "~/src/graphql/types/Mutation/updateVenue";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator";

const baseInput = {
  id: "venue-1",
  name: "Updated Venue",
  description: "Description",
  capacity: 100,
};

afterEach(() => {
  // mockContextCreator isolates mocks, but this is required by repo rules
});

describe("updateVenue resolver", () => {
  it("throws when user is unauthenticated", async () => {
    const { context } = createMockGraphQLContext({
      isAuthenticated: false,
    });

    await expect(
      updateVenue({}, { input: baseInput }, context),
    ).rejects.toBeInstanceOf(TalawaGraphQLError);
  });

  it("throws when venue does not exist", async () => {
    const { context, mocks } = createMockGraphQLContext({
      isAuthenticated: true,
      userId: "user-1",
    });

    mocks.drizzleClient.query.venuesTable.findFirst.mockResolvedValue(null);

    await expect(
      updateVenue({}, { input: baseInput }, context),
    ).rejects.toBeInstanceOf(TalawaGraphQLError);
  });

  it("throws when user record is missing", async () => {
    const { context, mocks } = createMockGraphQLContext({
      isAuthenticated: true,
      userId: "user-1",
    });

    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(null);
    mocks.drizzleClient.query.venuesTable.findFirst.mockResolvedValue({
      organizationId: "org-1",
      organization: { membershipsWhereOrganization: [] },
      attachmentsWhereVenue: [],
    });

    await expect(
      updateVenue({}, { input: baseInput }, context),
    ).rejects.toBeInstanceOf(TalawaGraphQLError);
  });

  it("throws when user is not authorized", async () => {
    const { context, mocks } = createMockGraphQLContext({
      isAuthenticated: true,
      userId: "user-1",
    });

    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
      role: "member",
    });

    mocks.drizzleClient.query.venuesTable.findFirst.mockResolvedValue({
      organizationId: "org-1",
      organization: {
        membershipsWhereOrganization: [{ role: "member" }],
      },
      attachmentsWhereVenue: [],
    });

    await expect(
      updateVenue({}, { input: baseInput }, context),
    ).rejects.toBeInstanceOf(TalawaGraphQLError);
  });

  it("updates venue successfully without attachments", async () => {
    const { context, mocks } = createMockGraphQLContext({
      isAuthenticated: true,
      userId: "user-1",
    });

    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
      role: "administrator",
    });

    mocks.drizzleClient.query.venuesTable.findFirst.mockResolvedValue({
      organizationId: "org-1",
      organization: {
        membershipsWhereOrganization: [{ role: "administrator" }],
      },
      attachmentsWhereVenue: [],
    });

    mocks.drizzleClient.transaction.mockImplementation(async (cb) =>
      cb({
        update: () => ({
          set: () => ({
            where: () => ({
              returning: async () => [
                { id: "venue-1", name: "Updated Venue" },
              ],
            }),
          }),
        }),
        delete: () => ({ where: () => undefined }),
        insert: () => ({
          values: () => ({
            returning: async () => [],
          }),
        }),
      }),
    );

    const result = await updateVenue({}, { input: baseInput }, context);

    expect(result.id).toBe("venue-1");
    expect(result.name).toBe("Updated Venue");
  });

  it("rolls back uploaded files when MinIO upload fails", async () => {
    const { context, mocks } = createMockGraphQLContext({
      isAuthenticated: true,
      userId: "user-1",
    });

    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
      role: "administrator",
    });

    mocks.drizzleClient.query.venuesTable.findFirst.mockResolvedValue({
      organizationId: "org-1",
      organization: {
        membershipsWhereOrganization: [{ role: "administrator" }],
      },
      attachmentsWhereVenue: [],
    });

    mocks.minio.client.putObject.mockRejectedValue(
      new Error("upload failed"),
    );

    await expect(
      updateVenue(
        {},
        {
          input: {
            ...baseInput,
            attachments: [
              Promise.resolve({
                mimetype: "image/png",
                createReadStream: () => null,
              }),
            ],
          },
        },
        context,
      ),
    ).rejects.toBeInstanceOf(TalawaGraphQLError);

    expect(mocks.minio.client.removeObject).toHaveBeenCalled();
  });
});
