import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import type { MutationCreateMemberArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { createMember as createMemberResolver } from "../../../src/resolvers/Mutation/createMember";
import { nanoid } from "nanoid";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  MEMBER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
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
    (message) => message
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createAdmin", () => {
  it(`throws User not found error if user with _id === context.userId does not exist`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          creatorId: Types.ObjectId().toString(),
        },
      }
    );

    const args: MutationCreateMemberArgs = {
      input: {
        organizationId: testOrganization?.id,
        userId: testUser?.id,
      },
    };

    const context = {
      userId: Types.ObjectId().toString(),
    };

    const result = await createMemberResolver?.({}, args, context);

    expect(result?.userErrors[0]).toStrictEqual({
      __typename: "UserNotFoundError",
      message: USER_NOT_FOUND_ERROR.MESSAGE,
    });
  });

  it(`throws NotFoundError if no user exists with _id === args.input.userId`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          creatorId: testUser?._id,
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $set: {
          userType: "SUPERADMIN",
        },
      }
    );

    const args: MutationCreateMemberArgs = {
      input: {
        organizationId: testOrganization?.id,
        userId: Types.ObjectId().toString(),
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const result = await createMemberResolver?.({}, args, context);

    expect(result?.userErrors[0]).toStrictEqual({
      __typename: "UserNotFoundError",
      message: USER_NOT_FOUND_ERROR.MESSAGE,
    });
  });

  it(`throws NotFoundError if no organization exists with _id === args.input.organizationId`, async () => {
    const args: MutationCreateMemberArgs = {
      input: {
        organizationId: Types.ObjectId().toString(),
        userId: "",
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const result = await createMemberResolver?.({}, args, context);

    expect(result?.userErrors[0]).toStrictEqual({
      __typename: "OrganizationNotFoundError",
      message: ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
    });
  });

  it(`throws MemberAlreadyInOrganizationError if user with _id === args.input.userId is already an member
  of organzation with _id === args.input.organizationId`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $push: {
          members: testUser?._id,
        },
      }
    );

    const args: MutationCreateMemberArgs = {
      input: {
        organizationId: testOrganization?.id,
        userId: testUser?.id,
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const result = await createMemberResolver?.({}, args, context);

    expect(result).toStrictEqual({
      __typename: "MemberAlreadyInOrganizationError",
      message: MEMBER_NOT_FOUND_ERROR.MESSAGE,
    });
    // try {
    //   await Organization.updateOne(
    //     {
    //       _id: testOrganization?._id,
    //     },
    //     {
    //       $push: {
    //         members: testUser?._id,
    //       },
    //     }
    //   );

    //   const args: MutationCreateMemberArgs = {
    //     input: {
    //       organizationId: testOrganization?.id,
    //       userId: testUser?.id,
    //     },
    //   };

    //   const context = {
    //     userId: testUser?.id,
    //   };

    //   await createMemberResolver?.({}, args, context);
    // } catch (error: any) {
    //   expect(error.message).toEqual(MEMBER_NOT_FOUND_ERROR.MESSAGE);
    // }
  });

  it(`Verify that the organization's members list now contains the user's ID`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          members: [],
        },
      }
    );
    const testUser2 = await User.create({
      email: `email2${nanoid().toLowerCase()}@gmail.com`,
      password: `pass2${nanoid().toLowerCase()}`,
      firstName: `firstName2${nanoid().toLowerCase()}`,
      lastName: `lastName2${nanoid().toLowerCase()}`,
      image: null,
      appLanguageCode: "en",
    });
    const context = {
      userId: testUser?.id,
    };
    const args: MutationCreateMemberArgs = {
      input: {
        organizationId: testOrganization?.id,
        userId: testUser2?.id,
      },
    };
    const result = await createMemberResolver?.({}, args, context);
    expect(result?.userErrors).toStrictEqual([]);
  });
});
