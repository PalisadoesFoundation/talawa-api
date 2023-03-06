import "dotenv/config";
import { User, Organization, MembershipRequest } from "../../../src/models";
import { MutationLoginArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { login as loginResolver } from "../../../src/resolvers/Mutation/login";
import {
  androidFirebaseOptions,
  iosFirebaseOptions,
} from "../../../src/config";
import {
  INVALID_CREDENTIALS_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
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
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> login", () => {
  afterEach(async () => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with email === args.data.email`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationLoginArgs = {
        data: {
          email: `invalidEmail${nanoid().toLowerCase()}@gmail.com`,
          password: "password",
        },
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });

      const { login: loginResolver } = await import(
        "../../../src/resolvers/Mutation/login"
      );

      await loginResolver?.({}, args, {});
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });

  it(`throws ValidationError if args.data.password !== password for user with
email === args.data.email`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationLoginArgs = {
        data: {
          email: testUser!.email,
          password: "incorrectPassword",
        },
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });

      const { login: loginResolver } = await import(
        "../../../src/resolvers/Mutation/login"
      );

      await loginResolver?.({}, args, {});
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(INVALID_CREDENTIALS_MESSAGE);
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
