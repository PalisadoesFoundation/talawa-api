import bcrypt from "bcryptjs";
import "dotenv/config";
import type mongoose from "mongoose";
import { nanoid } from "nanoid";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  INVALID_CREDENTIALS_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  AppUserProfile,
  MembershipRequest,
  Organization,
  User,
} from "../../../src/models";
import { login as loginResolver } from "../../../src/resolvers/Mutation/login";
import type { MutationLoginArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";
import type { TestUserType } from "../../helpers/userAndOrg";

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
    },
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
    },
  );

  await Organization.updateOne(
    {
      _id: testOrganization?._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    },
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

  it("throws NotFoundError if the user is not found after creating AppUserProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");

    // Spy on the translate function to capture error messages
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      // Create a new user with a unique email
      const newUser = await User.create({
        email: `nonexistentuser${nanoid().toLowerCase()}@gmail.com`,
        password: "password",
        firstName: "John",
        lastName: "Doe",
      });

      // Delete the user immediately to simulate a missing user scenario after AppUserProfile creation
      await User.deleteOne({ _id: newUser._id });

      // Prepare the arguments for the login resolver
      const args: MutationLoginArgs = {
        data: {
          email: newUser.email,
          password: "password",
        },
      };

      // Call the login resolver, which should throw an error
      const { login: loginResolver } = await import(
        "../../../src/resolvers/Mutation/login"
      );

      await loginResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Verify that the translate function was called with the correct error message
        expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
        // Verify that the error message is correctly translated
        expect(error.message).toEqual(
          `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
        );
      }
    }
  });

  it("creates a new AppUserProfile for the user if it doesn't exist and associates it with the user", async () => {
    // Create a new user without an associated AppUserProfile
    const newUser = await User.create({
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
    });

    const hashedPassword = await bcrypt.hash("password", 12);
    await User.updateOne(
      {
        _id: newUser?._id,
      },
      {
        $set: {
          password: hashedPassword,
        },
      },
    );

    const args: MutationLoginArgs = {
      data: {
        email: newUser?.email,
        password: "password",
      },
    };

    // Call the login resolver
    const loginPayload = await loginResolver?.({}, args, {});

    // Find the newly created AppUserProfile
    const userAppProfile = await AppUserProfile.findOne({
      userId: newUser?._id,
    });

    // Check if the AppUserProfile is created and associated with the user
    expect(userAppProfile).toBeDefined();
    expect(loginPayload).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          appUserProfileId: userAppProfile?._id,
        }),
      }),
    );
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
          `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
        );
      }
    }
  });
  it("creates a appUserProfile of the user if does not exist", async () => {
    const newUser = await User.create({
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
    });
    // console.log(newUser);
    const hashedTestPassword = await bcrypt.hash("password", 12);
    await User.updateOne(
      {
        _id: newUser?._id,
      },
      {
        $set: {
          password: hashedTestPassword,
        },
      },
    );
    const args: MutationLoginArgs = {
      data: {
        email: newUser?.email,
        password: "password",
      },
    };

    const loginPayload = await loginResolver?.({}, args, {});

    const userAppProfile = await AppUserProfile.findOne({
      userId: newUser?._id,
    });

    expect(userAppProfile).toBeDefined();
    expect(loginPayload).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          appUserProfileId: userAppProfile?._id,
        }),
      }),
    );
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
    // expect((await loginPayload?.user)?.userType).toEqual("SUPERADMIN");
  });

  it("should update the user's token and increment the tokenVersion", async () => {
    const newToken = "new-token";

    const mockUserAppProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    }).lean();

    const updatedUser = await AppUserProfile.findOneAndUpdate(
      { userId: testUser?._id },
      { token: newToken, $inc: { tokenVersion: 1 } },
      { new: true },
    );

    expect(updatedUser).toBeDefined();
    expect(updatedUser?.token).toBe(newToken);

    if (mockUserAppProfile?.tokenVersion !== undefined) {
      expect(updatedUser?.tokenVersion).toBe(
        mockUserAppProfile?.tokenVersion + 1,
      );
    }
  });

  it(`returns the user object with populated fields joinedOrganizations,
 registeredEvents,  membershipRequests, 
  organizationsBlockedBy`, async () => {
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
      .populate("registeredEvents")
      .populate("membershipRequests")
      .populate("organizationsBlockedBy")
      .lean();

    expect(loginPayload).toEqual(
      expect.objectContaining({
        user: testUser,
      }),
    );
    expect(loginPayload?.user).toBeDefined();
    expect(typeof loginPayload?.accessToken).toBe("string");
    expect(loginPayload?.accessToken.length).toBeGreaterThan(1);

    expect(typeof loginPayload?.refreshToken).toBe("string");
    expect(loginPayload?.refreshToken.length).toBeGreaterThan(1);
  });
});
