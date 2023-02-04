import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from "../../../src/models";
import { MutationUpdateOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { updateOrganization as updateOrganizationResolver } from "../../../src/resolvers/Mutation/updateOrganization";
import {
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    members: [testUser._id],
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> updateOrganization", () => {
  it(`throws NotFoundError if no organization exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdateOrganizationArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser._id,
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
        id: testOrganization._id,
      };

      const context = {
        userId: testUser._id,
      };

      await updateOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`updates the organization with _id === args.id and returns the updated organization`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $set: {
          admins: [testUser._id],
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser._id,
      },
      {
        $set: {
          adminFor: [testOrganization._id],
        },
      }
    );

    const args: MutationUpdateOrganizationArgs = {
      id: testOrganization._id,
      data: {
        description: "newDescription",
        isPublic: false,
        name: "newName",
        visibleInSearch: false,
      },
    };

    const context = {
      userId: testUser._id,
    };

    const updateOrganizationPayload = await updateOrganizationResolver?.(
      {},
      args,
      context
    );

    const testUpdateOrganizationPayload = await Organization.findOne({
      _id: testOrganization._id,
    }).lean();

    expect(updateOrganizationPayload).toEqual(testUpdateOrganizationPayload);
  });
});
