import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import type { MutationCreateMemberArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { createMember as createMemberResolver } from "../../../src/resolvers/Mutation/createMember";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  MEMBER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
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
            creatorId: Types.ObjectId().toString(),
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
        userId: Types.ObjectId().toString(),
      };

      await createMemberResolver?.({}, args, context);
      expect.fail();
    } catch (error) {
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

      await User.updateOne(
        {
          _id: testUser?._id,
        },
        {
          $set: {
            userType: "SUPERADMIN",
          },
        },
      );

      const args: MutationCreateMemberArgs = {
        input: {
          organizationId: testOrganization?.id,
          userId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createMemberResolver?.({}, args, context);
      expect.fail();
    } catch (error) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.input.organizationId`, async () => {
    try {
      const args: MutationCreateMemberArgs = {
        input: {
          organizationId: Types.ObjectId().toString(),
          userId: "",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createMemberResolver?.({}, args, context);
      expect.fail();
    } catch (error) {
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws UnauthorizedError if user with _id === args.input.userId is already an member
  of organzation with _id === args.input.organizationId`, async () => {
    try {
      const resultsArrayForMemberTest =
        await createTestUserAndOrganization(true);

      const args: MutationCreateMemberArgs = {
        input: {
          organizationId: resultsArrayForMemberTest[1]?._id,
          userId: resultsArrayForMemberTest[0]?._id,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createMemberResolver?.({}, args, context);
      expect.fail();
    } catch (error) {
      expect((error as Error).message).toEqual(MEMBER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`Verify that the organization's members list now contains the user's ID`, async () => {
    const args: MutationCreateMemberArgs = {
      input: {
        organizationId: testOrganization?._id,
        userId: testUser?._id,
      },
    };

    const context = {
      userId: testUser?.id,
    };

    await createMemberResolver?.({}, args, context);

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
});
