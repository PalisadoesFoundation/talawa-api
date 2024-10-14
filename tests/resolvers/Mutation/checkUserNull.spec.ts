import type mongoose from "mongoose";
import { Organization, User } from "../../../src/models";
import type { MutationSendMembershipRequestArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { nanoid } from "nanoid";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { sendMembershipRequest as sendMembershipRequestResolver } from "../../../src/resolvers/Mutation/sendMembershipRequest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import { Types } from "mongoose";
import { fail } from "assert";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = await createTestUser();

  testOrganization = await Organization.create({
    name: `name${nanoid().toLowerCase()}`,
    description: `desc${nanoid().toLowerCase()}`,
    isPublic: true,
    creatorId: testUser?._id,
    members: [testUser?._id],
    visibleInSearch: true,
  });

  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> sendMembershipRequest", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId when sending membership request`, async () => {
    const args: MutationSendMembershipRequestArgs = {
      organizationId: testOrganization?.id,
    };

    const context = {
      userId: new Types.ObjectId().toString(),
    };

    // Mock User.findById to return null
    vi.spyOn(User, "findById").mockResolvedValueOnce(null);

    try {
      await sendMembershipRequestResolver?.({}, args, context);
      // If the resolver doesn't throw, fail the test
      fail("Expected an error to be thrown");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toMatch(/user not found|user.notFound/i);

        expect(error).toHaveProperty("message");

        if ("code" in error) expect(error).toHaveProperty("code");
        if ("param" in error) expect(error).toHaveProperty("param");

        if ("extensions" in error) {
          const errorWithExtensions = error as Error & {
            extensions?: { code?: string; param?: string };
          };
          expect(errorWithExtensions.extensions).toBeDefined();
          if (errorWithExtensions.extensions) {
            if ("code" in errorWithExtensions.extensions)
              expect(errorWithExtensions.extensions).toHaveProperty("code");
            if ("param" in errorWithExtensions.extensions)
              expect(errorWithExtensions.extensions).toHaveProperty("param");
          }
        }
      } else {
        fail("Expected error to be an instance of Error");
      }
    }
  });
});
