import "dotenv/config";
import { User, Organization, MembershipRequest } from "../../../src/models";
import { MutationLoginArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { login as loginResolver } from "../../../src/resolvers/Mutation/login";
import {
  androidFirebaseOptions,
  iosFirebaseOptions,
} from "../../../src/config";
import { USER_NOT_FOUND } from "../../../src/constants";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType } from "../../helpers/userAndOrg";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";

let testUser: testUserType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestEventWithRegistrants();
  const hashedTestPassword = await bcrypt.hash("password", 12);
  testUser = temp[0];
  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $set: {
        password: hashedTestPassword,
      },
    }
  );
  const testOrganization = temp[1];
  const testMembershipRequest = await MembershipRequest.create({
    organization: testOrganization!._id,
    user: testUser!._id,
  });

  await User.updateOne(
    {
      _id: testUser!._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    }
  );

  await Organization.updateOne(
    {
      _id: testOrganization!._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    }
  );
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> login", () => {
  it(`throws NotFoundError if no user exists with email === args.data.email`, async () => {
    try {
      const args: MutationLoginArgs = {
        data: {
          email: `invalidEmail${nanoid().toLowerCase()}@gmail.com`,
          password: "password",
        },
      };

      await loginResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws ValidationError if args.data.password !== password for user with
  email === args.data.email`, async () => {
    try {
      const args: MutationLoginArgs = {
        data: {
          email: testUser!.email,
          password: "incorrectPassword",
        },
      };

      await loginResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual("Invalid credentials");
    }
  });

  it(`returns the user object with populated fields joinedOrganizations, createdOrganizations,
  createdEvents, registeredEvents, eventAdmin, adminFor, membershipRequests, 
  organizationsBlockedBy, organizationUserBelongsTo`, async () => {
    const args: MutationLoginArgs = {
      data: {
        email: testUser!.email,
        password: "password",
      },
    };

    const loginPayload = await loginResolver?.({}, args, {});

    testUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["-password"])
      .populate("joinedOrganizations")
      .populate("createdOrganizations")
      .populate("createdEvents")
      .populate("registeredEvents")
      .populate("eventAdmin")
      .populate("adminFor")
      .populate("membershipRequests")
      .populate("organizationsBlockedBy")
      .populate("organizationUserBelongsTo")
      .lean();

    expect(loginPayload).toEqual(
      expect.objectContaining({
        user: testUser,
        androidFirebaseOptions,
        iosFirebaseOptions,
      })
    );
    expect(typeof loginPayload?.accessToken).toBe("string");
    expect(loginPayload?.accessToken.length).toBeGreaterThan(1);

    expect(typeof loginPayload?.refreshToken).toBe("string");
    expect(loginPayload?.refreshToken.length).toBeGreaterThan(1);
  });
});
