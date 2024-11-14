import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationAssignToUserTagsArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

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
  TAG_NOT_FOUND,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  AppUserProfile,
  OrganizationTagUser,
  TagUser,
  User,
} from "../../../src/models";
import type { TestUserTagType } from "../../helpers/tags";
import {
  createRootTagsWithOrg,
  createTwoLevelTagsWithOrg,
} from "../../helpers/tags";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;

let adminUser: TestUserType;
let adminUser2: TestUserType;
let testTag2: TestUserTagType;
let testTag3: TestUserTagType;
let testTag: TestUserTagType;
let testSubTag1: TestUserTagType;
let testOrg1: TestOrganizationType;
let testOrg2: TestOrganizationType;
let randomUser1: TestUserType;
let randomUser2: TestUserType;
let randomUser3: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [adminUser, testOrg1, [testTag, testSubTag1]] =
    await createTwoLevelTagsWithOrg();
  [adminUser2, testOrg2, [testTag2, testTag3]] = await createRootTagsWithOrg(2);
  randomUser1 = await createTestUser();
  randomUser2 = await createTestUser();
  randomUser3 = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> assignToUserTags", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    await testErrorScenario({
      args: {
        input: {
          selectedTagIds: [testTag?._id.toString() ?? ""],
          currentTagId: testTag?._id.toString() ?? "",
        },
      },
      context: { userId: new Types.ObjectId().toString() },
      expectedError: USER_NOT_FOUND_ERROR.MESSAGE,
    });
  });

  it(`throws NotFoundError if no tag exists with _id === args.input.currentTagId `, async () => {
    await testErrorScenario({
      args: {
        input: {
          selectedTagIds: [testTag?._id.toString() ?? ""],
          currentTagId: new Types.ObjectId().toString(),
        },
      },
      context: { userId: adminUser?._id },
      expectedError: TAG_NOT_FOUND.MESSAGE,
    });
  });

  it(`throws Not Authorized Error if the current user is not a superadmin or admin of the organization `, async () => {
    await testErrorScenario({
      args: {
        input: {
          selectedTagIds: [testTag?._id.toString() ?? ""],
          currentTagId: testTag?._id.toString() ?? "",
        },
      },
      context: { userId: randomUser1?._id },
      expectedError: USER_NOT_AUTHORIZED_ERROR.MESSAGE,
    });
  });

  it(`throws NotFoundError if one of the selected tags doesn't exist`, async () => {
    await testErrorScenario({
      args: {
        input: {
          selectedTagIds: [
            testTag?._id.toString() ?? "",
            new Types.ObjectId().toString(),
          ],
          currentTagId: testTag?._id.toString() ?? "",
        },
      },
      context: { userId: adminUser?._id },
      expectedError: TAG_NOT_FOUND.MESSAGE,
    });
  });

  it("throws error if user does not have appUserProfile", async () => {
    const temp = await createTestUser();
    await AppUserProfile.deleteOne({
      userId: temp?._id,
    });

    await testErrorScenario({
      args: {
        input: {
          selectedTagIds: [testTag?._id.toString() ?? ""],
          currentTagId: testTag?._id.toString() ?? "",
        },
      },
      context: { userId: temp?._id },
      expectedError: USER_NOT_AUTHORIZED_ERROR.MESSAGE,
    });
  });

  it(`Tag assignment should be successful and the tag is returned`, async () => {
    // assign testTag2 to random users
    await Promise.all([
      User.findOneAndUpdate(
        {
          _id: randomUser2?._id,
        },
        {
          joinedOrganizations: testOrg2,
        },
      ),
      User.findOneAndUpdate(
        {
          _id: randomUser3?._id,
        },
        {
          joinedOrganizations: testOrg2,
        },
      ),
      TagUser.create({
        userId: randomUser2?._id,
        tagId: testTag2?._id,
        organizationId: testTag2?.organizationId,
      }),
      TagUser.create({
        userId: randomUser3?._id,
        tagId: testTag2?._id,
        organizationId: testTag2?.organizationId,
      }),
    ]);

    // now assign them to a new tag with the help of the mutation
    const args: MutationAssignToUserTagsArgs = {
      input: {
        selectedTagIds: [testTag3?._id.toString() ?? ""],
        currentTagId: testTag2?._id.toString() ?? "",
      },
    };

    const context = {
      userId: adminUser2?._id,
    };

    const { assignToUserTags: assignToUserTagsResolver } = await import(
      "../../../src/resolvers/Mutation/assignToUserTags"
    );

    const payload = await assignToUserTagsResolver?.({}, args, context);

    expect(payload?._id.toString()).toEqual(testTag2?._id.toString());

    const tagAssignedToRandomUser2 = await TagUser.exists({
      tagId: testTag3,
      userId: randomUser2?._id,
    });

    const tagAssignedToRandomUser3 = await TagUser.exists({
      tagId: testTag3,
      userId: randomUser3?._id,
    });

    expect(tagAssignedToRandomUser2).toBeTruthy();
    expect(tagAssignedToRandomUser3).toBeTruthy();
  });

  it(`Should assign all the ancestor tags and returns the current tag`, async () => {
    // create a new tag with the organization
    const newTestTag = await OrganizationTagUser.create({
      name: "newTestTag",
      organizationId: testOrg1?._id,
    });

    // assign this new test tag to random users
    await Promise.all([
      User.findOneAndUpdate(
        {
          _id: randomUser2?._id,
        },
        {
          joinedOrganizations: testOrg1,
        },
      ),
      User.findOneAndUpdate(
        {
          _id: randomUser3?._id,
        },
        {
          joinedOrganizations: testOrg1,
        },
      ),
      TagUser.create({
        userId: randomUser2?._id,
        tagId: newTestTag?._id,
        organizationId: newTestTag?.organizationId,
      }),
      TagUser.create({
        userId: randomUser3?._id,
        tagId: newTestTag?._id,
        organizationId: newTestTag?.organizationId,
      }),
    ]);

    // now assign them a new sub tag, which will automatically assign them the parent tag also
    const args: MutationAssignToUserTagsArgs = {
      input: {
        selectedTagIds: [testSubTag1?._id.toString() ?? ""],
        currentTagId: newTestTag?._id.toString() ?? "",
      },
    };
    const context = {
      userId: adminUser?._id,
    };

    const { assignToUserTags: assignToUserTagsResolver } = await import(
      "../../../src/resolvers/Mutation/assignToUserTags"
    );

    const payload = await assignToUserTagsResolver?.({}, args, context);

    expect(payload?._id.toString()).toEqual(newTestTag?._id.toString());

    const subTagAssignedToRandomUser2 = await TagUser.exists({
      tagId: testSubTag1?._id,
      userId: randomUser2?._id,
    });

    const subTagAssignedToRandomUser3 = await TagUser.exists({
      tagId: testSubTag1?._id,
      userId: randomUser3?._id,
    });

    expect(subTagAssignedToRandomUser2).toBeTruthy();
    expect(subTagAssignedToRandomUser3).toBeTruthy();

    const ancestorTagAssignedToRandomUser2 = await TagUser.exists({
      tagId: testTag?._id.toString() ?? "",
      userId: randomUser2?._id,
    });

    const ancestorTagAssignedToRandomUser3 = await TagUser.exists({
      tagId: testTag?._id.toString() ?? "",
      userId: randomUser3?._id,
    });

    expect(ancestorTagAssignedToRandomUser2).toBeTruthy();
    expect(ancestorTagAssignedToRandomUser3).toBeTruthy();
  });
});

const testErrorScenario = async ({
  args,
  context,
  expectedError,
}: {
  args: MutationAssignToUserTagsArgs;
  context: { userId: string };
  expectedError: string;
}): Promise<void> => {
  const { requestContext } = await import("../../../src/libraries");
  const spy = vi
    .spyOn(requestContext, "translate")
    .mockImplementationOnce((message) => `Translated ${message}`);
  try {
    const { assignToUserTags: assignToUserTagsResolver } = await import(
      "../../../src/resolvers/Mutation/assignToUserTags"
    );
    await assignToUserTagsResolver?.({}, args, context);
    throw new Error("Expected error was not thrown");
  } catch (error: unknown) {
    if (error instanceof Error) {
      expect(error.message).toEqual(`Translated ${expectedError}`);
    } else {
      throw new Error("Unexpected error type");
    }
    expect(spy).toHaveBeenLastCalledWith(expectedError);
  }
};
