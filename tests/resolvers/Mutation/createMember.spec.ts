import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { AppUserProfile, Organization } from "../../../src/models";
import type { MutationCreateMemberArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { createMember as createMemberResolver } from "../../../src/resolvers/Mutation/createMember";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestUserAndOrganization(false);

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createAdmin", () => {
  it(`throws User not found error if user with _id === context.userId does not exist`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            creatorId: new Types.ObjectId().toString(),
          },
        },
      );

      const args: MutationCreateMemberArgs = {
        input: {
          organizationId: testOrganization?.id,
          userId: testUser?.id,
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await createMemberResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.input.userId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            creatorId: testUser?._id,
          },
        },
      );

      await AppUserProfile.updateOne(
        {
          userId: testUser?._id,
        },
        {
          $set: {
            isSuperAdmin: true,
          },
        },
      );

      const args: MutationCreateMemberArgs = {
        input: {
          organizationId: testOrganization?.id,
          userId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createMemberResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.input.organizationId`, async () => {
    try {
      const args: MutationCreateMemberArgs = {
        input: {
          organizationId: new Types.ObjectId().toString(),
          userId: "",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createMemberResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws UnauthorizedError if user with _id === args.input.userId is already an member
  of organzation with _id === args.input.organizationId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            members: testUser?._id,
          },
        },
      );

      const args: MutationCreateMemberArgs = {
        input: {
          organizationId: testOrganization?.id,
          userId: testUser?.id,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createMemberResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(MEMBER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`Verify that the organization's members list now contains the user's ID`, async () => {
    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    })
      .select(["members"])
      .lean();

    const updatedOrganizationCheck = updatedTestOrganization?.members.some(
      (member) => member.equals(testUser?._id),
    );

    expect(updatedOrganizationCheck).toBe(true);
  });
  it("throws error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    try {
      await AppUserProfile.deleteOne({
        userId: testUser?._id,
      });

      const args: MutationCreateMemberArgs = {
        input: {
          organizationId: testOrganization?.id,
          userId: testUser?.id,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createMemberResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
