import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from "../../../src/models";
import { MutationCreateAdminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { createAdmin as createAdminResolver } from "../../../src/resolvers/Mutation/createAdmin";
import {
  ORGANIZATION_MEMBER_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

beforeAll(async () => {
  await connect();

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
    admins: [testUser._id],
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> createAdmin", () => {
  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    try {
      const args: MutationCreateAdminArgs = {
        data: {
          organizationId: Types.ObjectId().toString(),
          userId: "",
        },
      };

      const context = {
        userId: testUser.id,
      };

      await createAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not the creator
  of organization with _id === args.data.organizationId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $set: {
            creator: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationCreateAdminArgs = {
        data: {
          organizationId: testOrganization.id,
          userId: testUser.id,
        },
      };

      const context = {
        userId: testUser.id,
      };

      await createAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.data.userId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $set: {
            creator: testUser._id,
          },
        }
      );

      const args: MutationCreateAdminArgs = {
        data: {
          organizationId: testOrganization.id,
          userId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser.id,
      };

      await createAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if user with _id === args.data.userId is not a member
  of organzation with _id === args.data.organizationId`, async () => {
    try {
      const args: MutationCreateAdminArgs = {
        data: {
          organizationId: testOrganization.id,
          userId: testUser.id,
        },
      };

      const context = {
        userId: testUser.id,
      };

      await createAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_MEMBER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if user with _id === args.data.userId is already an admin
  of organzation with _id === args.data.organizationId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $push: {
            members: testUser._id,
          },
        }
      );

      const args: MutationCreateAdminArgs = {
        data: {
          organizationId: testOrganization.id,
          userId: testUser.id,
        },
      };

      const context = {
        userId: testUser.id,
      };

      await createAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`creates the admin and returns admin's user object`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $set: {
          admins: [],
        },
      }
    );

    const args: MutationCreateAdminArgs = {
      data: {
        organizationId: testOrganization.id,
        userId: testUser.id,
      },
    };

    const context = {
      userId: testUser.id,
    };

    const createAdminPayload = await createAdminResolver?.({}, args, context);

    const updatedTestUser = await User.findOne({
      _id: testUser._id,
    })
      .select(["-password"])
      .lean();

    expect(createAdminPayload).toEqual(updatedTestUser);

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization._id,
    })
      .select(["admins"])
      .lean();

    expect(updatedTestOrganization!.admins).toEqual([testUser._id]);
  });
});
