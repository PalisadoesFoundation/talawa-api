import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
  MembershipRequest,
  Interface_MembershipRequest,
} from "../../../src/models";
import { MutationSendMembershipRequestArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { sendMembershipRequest as sendMembershipRequestResolver } from "../../../src/resolvers/Mutation/sendMembershipRequest";
import { ORGANIZATION_NOT_FOUND, USER_NOT_FOUND } from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testMembershipRequest: Interface_MembershipRequest &
  Document<any, any, Interface_MembershipRequest>;

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
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
      },
    }
  );

  testMembershipRequest = await MembershipRequest.create({
    user: testUser._id,
    organization: testOrganization._id,
  });

  await Organization.updateOne(
    {
      _id: testOrganization._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    }
  );

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> sendMembershipRequest", () => {
  it(`throws NotFoundError if the current user with _id === context.userId does not exist`, async () => {
    try {
      const args: MutationSendMembershipRequestArgs = {
        organizationId: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    try {
      const args: MutationSendMembershipRequestArgs = {
        organizationId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws ConflictError if a membershipRequest with fields user === context.userId
  and organization === args.organizationId already exists`, async () => {
    try {
      const args: MutationSendMembershipRequestArgs = {
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testUser.id,
      };

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual("MembershipRequest already exists");
    }
  });

  it(`creates new membershipRequest and returns it`, async () => {
    await MembershipRequest.deleteOne({
      _id: testMembershipRequest._id,
    });

    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $set: {
          membershipRequests: [],
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser._id,
      },
      {
        $set: {
          membershipRequests: [],
        },
      }
    );

    const args: MutationSendMembershipRequestArgs = {
      organizationId: testOrganization.id,
    };

    const context = {
      userId: testUser.id,
    };

    const sendMembershipRequestPayload = await sendMembershipRequestResolver?.(
      {},
      args,
      context
    );

    expect(sendMembershipRequestPayload).toEqual(
      expect.objectContaining({
        user: testUser._id,
        organization: testOrganization._id,
      })
    );
  });
});
