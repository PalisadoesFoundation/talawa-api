import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import { MutationUpdateOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { updateOrganization as updateOrganizationResolver } from "../../../src/resolvers/Mutation/updateOrganization";
import {
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> updateOrganization", () => {
  it(`throws NotFoundError if no organization exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdateOrganizationArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!._id,
      };

      await updateOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not an admin
  of organization with _id === args.id`, async () => {
    try {
      const args: MutationUpdateOrganizationArgs = {
        id: testOrganization!._id,
      };

      const context = {
        userId: testUser!._id,
      };

      await updateOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`updates the organization with _id === args.id and returns the updated organization`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization!._id,
      },
      {
        $set: {
          admins: [testUser!._id],
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser!._id,
      },
      {
        $set: {
          adminFor: [testOrganization!._id],
        },
      }
    );

    const args: MutationUpdateOrganizationArgs = {
      id: testOrganization!._id,
      data: {
        description: "newDescription",
        isPublic: false,
        name: "newName",
        visibleInSearch: false,
      },
    };

    const context = {
      userId: testUser!._id,
    };

    const updateOrganizationPayload = await updateOrganizationResolver?.(
      {},
      args,
      context
    );

    const testUpdateOrganizationPayload = await Organization.findOne({
      _id: testOrganization!._id,
    }).lean();

    expect(updateOrganizationPayload).toEqual(testUpdateOrganizationPayload);
  });
});
