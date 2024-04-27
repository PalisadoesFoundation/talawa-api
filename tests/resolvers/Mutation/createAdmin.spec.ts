import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { AppUserProfile, Organization, User } from "../../../src/models";
import type { MutationCreateAdminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { nanoid } from "nanoid";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ORGANIZATION_MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { createAdmin as createAdminResolver } from "../../../src/resolvers/Mutation/createAdmin";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

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
    (message) => message,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createAdmin", () => {
  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    const args: MutationCreateAdminArgs = {
      data: {
        organizationId: new Types.ObjectId().toString(),
        userId: "",
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const result = await createAdminResolver?.({}, args, context);
    expect(result?.userErrors[0]).toStrictEqual({
      __typename: "OrganizationNotFoundError",
      message: ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
    });
    // } catch (error: unknown) {
    //   expect((error as Error).message).toEqual(
    //     ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
    //   );
    // }
  });

  it(`throws User not found error if user with _id === context.userId does not exist`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          creatorId: new Types.ObjectId().toString(),
        },
      },
    );

    const args: MutationCreateAdminArgs = {
      data: {
        organizationId: testOrganization?.id,
        userId: testUser?.id,
      },
    };

    const context = {
      userId: new Types.ObjectId().toString(),
    };

    const result = await createAdminResolver?.({}, args, context);
    expect(result?.userErrors[0]).toStrictEqual({
      __typename: "UserNotFoundError",
      message: USER_NOT_FOUND_ERROR.MESSAGE,
    });
    // } catch (error: unknown) {
    //   expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    // }
  });

  it(`throws NotFoundError if no user exists with _id === args.data.userId`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          creatorId: testUser?._id,
        },
      },
    );

    await AppUserProfile.updateOne(
      {
        userId: testUser?._id,
      },
      {
        $set: {
          isSuperAdmin: true,
        },
      },
    );

    const args: MutationCreateAdminArgs = {
      data: {
        organizationId: testOrganization?.id,
        userId: new Types.ObjectId().toString(),
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const result = await createAdminResolver?.({}, args, context);
    expect(result?.userErrors[0]).toStrictEqual({
      __typename: "UserNotFoundError",
      message: USER_NOT_FOUND_ERROR.MESSAGE,
    });
    // } catch (error: unknown) {
    //   expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    // }
  });
  it("throws error if user does not have AppUserProfile", async () => {
    const args: MutationCreateAdminArgs = {
      data: {
        organizationId: testOrganization?.id,
        userId: new Types.ObjectId().toString(),
      },
    };
    const newUser = await User.create({
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: `pass${nanoid().toLowerCase()}`,
      firstName: `firstName${nanoid().toLowerCase()}`,
      lastName: `lastName${nanoid().toLowerCase()}`,
      image: null,
    });
    const context = {
      userId: newUser?.id,
    };
    const result = await createAdminResolver?.({}, args, context);
    expect(result?.userErrors[0]).toStrictEqual({
      __typename: "UserNotAuthorizedError",
      message: USER_NOT_AUTHORIZED_ERROR.MESSAGE,
    });
    // } catch (error: unknown) {
    //   expect((error as Error).message).toEqual(
    //     `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
    //   );
    // }
  });
  it("throws error if user does not exists", async () => {
    const newUser = await User.create({
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: `pass${nanoid().toLowerCase()}`,
      firstName: `firstName${nanoid().toLowerCase()}`,
      lastName: `lastName${nanoid().toLowerCase()}`,
      image: null,
    });
    const args: MutationCreateAdminArgs = {
      data: {
        organizationId: testOrganization?.id,
        userId: newUser.id,
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const result = await createAdminResolver?.({}, args, context);
    expect(result?.userErrors[0]).toStrictEqual({
      __typename: "UserNotFoundError",
      message: USER_NOT_FOUND_ERROR.MESSAGE,
    });
    // } catch (error: unknown) {
    //   expect((error as Error).message).toEqual(
    //     `${USER_NOT_FOUND_ERROR.MESSAGE}`,
    //   );
    // }
  });

  it(`throws NotFoundError if user with _id === args.data.userId is not a member
  of organzation with _id === args.data.organizationId`, async () => {
    const args: MutationCreateAdminArgs = {
      data: {
        organizationId: testOrganization?.id,
        userId: testUser?.id,
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const result = await createAdminResolver?.({}, args, context);
    expect(result?.userErrors[0]).toStrictEqual({
      __typename: "OrganizationMemberNotFoundError",
      message: ORGANIZATION_MEMBER_NOT_FOUND_ERROR.MESSAGE,
    });
    // } catch (error: any) {
    //   expect(error.message).toEqual(
    //     ORGANIZATION_MEMBER_NOT_FOUND_ERROR.MESSAGE
    //   );
    // }
  });

  it(`throws UnauthorizedError if user with _id === args.data.userId is already an admin
  of organzation with _id === args.data.organizationId`, async () => {
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $push: {
          members: testUser?._id,
        },
      },
      {
        new: true,
      },
    );

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    const args: MutationCreateAdminArgs = {
      data: {
        organizationId: testOrganization?.id,
        userId: testUser?.id,
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const result = await createAdminResolver?.({}, args, context);
    // } catch (error: any) {
    //   expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    // }
    expect(result?.userErrors[0]).toStrictEqual({
      __typename: "UserNotAuthorizedError",
      message: USER_NOT_AUTHORIZED_ERROR.MESSAGE,
    });
  });

  it(`creates the admin and returns admin's user object`, async () => {
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          admins: [],
        },
      },
      {
        new: true,
      },
    );

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    const args: MutationCreateAdminArgs = {
      data: {
        organizationId: testOrganization?.id,
        userId: testUser?.id,
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const createAdminPayload = await createAdminResolver?.({}, args, context);

    const updatedTestUser = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["-password"])
      .lean();

    expect(createAdminPayload?.user).toEqual(updatedTestUser);

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    })
      .select(["admins"])
      .lean();

    expect(updatedTestOrganization?.admins).toEqual([testUser?._id]);
  });

  it("throws error if user does not exists", async () => {
    const args: MutationCreateAdminArgs = {
      data: {
        organizationId: testOrganization?.id,
        userId: new Types.ObjectId().toString(),
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const result = await createAdminResolver?.({}, args, context);
    expect(result?.userErrors[0]).toStrictEqual({
      __typename: "UserNotFoundError",
      message: USER_NOT_FOUND_ERROR.MESSAGE,
    });
    // } catch (error: unknown) {
    //   // console.log(error)
    //   expect((error as Error).message).toEqual(
    //     `${USER_NOT_FOUND_ERROR.MESSAGE}`,
    //   );
    // }
  });
});
