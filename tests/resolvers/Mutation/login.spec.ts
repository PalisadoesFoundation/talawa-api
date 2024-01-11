import "dotenv/config";
import { User, Organization, MembershipRequest } from "../../../src/models";
import type {
  MutationLoginArgs,
  TransactionLog,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { login as loginResolver } from "../../../src/resolvers/Mutation/login";
import {
  INVALID_CREDENTIALS_ERROR,
  TRANSACTION_LOG_TYPES,
  USER_NOT_FOUND_ERROR,
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
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";

import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

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
    organization: testOrganization?._id,
    user: testUser?._id,
  });

  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    }
  );

  await Organization.updateOne(
    {
      _id: testOrganization?._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    }
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> login", () => {
  afterEach(() => {
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

      const { login: loginResolver } = await import(
        "../../../src/resolvers/Mutation/login"
      );

      await loginResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
        );
      }
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
          email: testUser?.email,
          password: "incorrectPassword",
        },
      };

      const { login: loginResolver } = await import(
        "../../../src/resolvers/Mutation/login"
      );

      await loginResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toHaveBeenLastCalledWith(INVALID_CREDENTIALS_ERROR.MESSAGE);
      }
    }
  });

  it(`updates the user with email === LAST_RESORT_SUPERADMIN_EMAIL to the superadmin role`, async () => {
    // Set the LAST_RESORT_SUPERADMIN_EMAIL to equal to the test user's email
    vi.doMock("../../../src/constants", async () => {
      const constants: object = await vi.importActual("../../../src/constants");
      return {
        ...constants,
        LAST_RESORT_SUPERADMIN_EMAIL: testUser?.email,
      };
    });

    const args: MutationLoginArgs = {
      data: {
        email: testUser?.email,
        password: "password",
      },
    };

    const { login: loginResolver } = await import(
      "../../../src/resolvers/Mutation/login"
    );

    const loginPayload = await loginResolver?.({}, args, {});

    expect(await loginPayload?.user).toBeDefined();
    expect((await loginPayload?.user)?.userType).toEqual("SUPERADMIN");
  });

  it("should update the user's token and increment the tokenVersion", async () => {
    const newToken = "new-token";

    const mockUser = await User.findOne({
      _id: testUser?._id,
    }).lean();

    const updatedUser = await User.findOneAndUpdate(
      { _id: testUser?._id },
      { token: newToken, $inc: { tokenVersion: 1 } },
      { new: true }
    );

    expect(updatedUser).toBeDefined();
    expect(updatedUser?.token).toBe(newToken);

    if (mockUser?.tokenVersion !== undefined) {
      expect(updatedUser?.tokenVersion).toBe(mockUser?.tokenVersion + 1);
    }

    const mostRecentTransactions = getTransactionLogs!({}, {}, {})!;

    expect((mostRecentTransactions as TransactionLog[])[0]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.UPDATE,
      model: "User",
    });
  });

  it(`returns the user object with populated fields joinedOrganizations, createdOrganizations,
  createdEvents, registeredEvents, eventAdmin, adminFor, membershipRequests, 
  organizationsBlockedBy, organizationUserBelongsTo`, async () => {
    const args: MutationLoginArgs = {
      data: {
        email: testUser?.email,
        password: "password",
      },
    };

    const loginPayload = await loginResolver?.({}, args, {});

    testUser = await User.findOne({
      _id: testUser?._id,
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
      })
    );
    expect(loginPayload?.user).toBeDefined();
    expect(typeof loginPayload?.accessToken).toBe("string");
    expect(loginPayload?.accessToken.length).toBeGreaterThan(1);

    expect(typeof loginPayload?.refreshToken).toBe("string");
    expect(loginPayload?.refreshToken.length).toBeGreaterThan(1);
  });
});
