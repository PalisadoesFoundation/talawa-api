import "dotenv/config";
import { Document } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Event,
  MembershipRequest,
} from "../../../src/models";
import { MutationLoginArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { login as loginResolver } from "../../../src/resolvers/Mutation/login";
import {
  androidFirebaseOptions,
  iosFirebaseOptions,
} from "../../../src/config";
import { USER_NOT_FOUND } from "../../../src/constants";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

  const hashedTestPassword = await bcrypt.hash("password", 12);

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: hashedTestPassword,
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
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
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  const testEvent = await Event.create({
    title: "title",
    description: "decription",
    recurring: false,
    allDay: true,
    startDate: new Date(),
    isPublic: true,
    isRegisterable: true,
    creator: testUser._id,
    registrants: [
      {
        userId: testUser.id,
        user: testUser._id,
      },
    ],
    admins: [testUser._id],
    organization: testOrganization._id,
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        eventAdmin: testEvent._id,
        createdEvents: testEvent._id,
        registeredEvents: testEvent._id,
      },
    }
  );

  const testMembershipRequest = await MembershipRequest.create({
    organization: testOrganization._id,
    user: testUser._id,
  });

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
});

afterAll(async () => {
  await disconnect();
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
          email: testUser.email,
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
        email: testUser.email,
        password: "password",
      },
    };

    const loginPayload = await loginResolver?.({}, args, {});

    testUser = await User.findOne({
      _id: testUser._id,
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
