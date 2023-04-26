import "dotenv/config";
import mongoose, { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import { MutationCreateMemberArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { createMember as createMemberResolver } from "../../../src/resolvers/Mutation/createMember";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  MEMBER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import {
  createTestUserAndOrganization,
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

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
    (message) => message
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createAdmin", () => {
  it(`throws NotFoundError if no user exists with _id === args.data.userId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            creator: testUser?._id,
          },
        }
      );

      await User.updateOne(
        {
          _id: testUser?._id,
        },
        {
          $set: {
            userType: "SUPERADMIN",
          },
        }
      );

      const args: MutationCreateMemberArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createMemberResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    try {
      const args: MutationCreateMemberArgs = {
        data: {
          organizationId: Types.ObjectId().toString(),
          userId: "",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createMemberResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if user with _id === args.data.userId is already an member
  of organzation with _id === args.data.organizationId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            members: testUser?._id,
          },
        }
      );

      const args: MutationCreateMemberArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: testUser?.id,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createMemberResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(MEMBER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`Verify that the organization's members list now contains the user's ID`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          members: [],
        },
      }
    );

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    })
      .select(["members"])
      .lean();

    expect(updatedTestOrganization?.members).toEqual([testUser?._id]);
  });
});
