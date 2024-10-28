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
let randomUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [adminUser, testOrg1, [testTag, testSubTag1]] =
    await createTwoLevelTagsWithOrg();
  [adminUser2, testOrg2, [testTag2, testTag3]] = await createRootTagsWithOrg(2);
  randomUser = await createTestUser();
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
      context: { userId: randomUser?._id },
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
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignToUserTagsArgs = {
        input: {
          selectedTagIds: [testTag?._id.toString() ?? ""],
          currentTagId: testTag?._id.toString() ?? "",
        },
      };

      const temp = await createTestUser();

      await AppUserProfile.deleteOne({
        userId: temp?._id,
      });

      const context = {
        userId: temp?._id,
      };

      const { assignToUserTags: assignToUserTagsResolver } = await import(
        "../../../src/resolvers/Mutation/assignToUserTags"
      );

      await assignToUserTagsResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`Tag assignment should be successful and the tag is returned`, async () => {
    // create random users and assign them testTag2
    const randomUser1 = await createTestUser();
    const randomUser2 = await createTestUser();

    await Promise.all([
      User.findOneAndUpdate(
        {
          _id: randomUser1?._id,
        },
        {
          joinedOrganizations: testOrg2,
        },
      ),
      User.findOneAndUpdate(
        {
          _id: randomUser2?._id,
        },
        {
          joinedOrganizations: testOrg2,
        },
      ),
      TagUser.create({
        userId: randomUser1?._id,
        tagId: testTag2?._id,
      }),
      TagUser.create({
        userId: randomUser2?._id,
        tagId: testTag2?._id,
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

    const tagAssignedToRandomUser1 = await TagUser.exists({
      tagId: testTag3,
      userId: randomUser1?._id,
    });

    const tagAssignedToRandomUser2 = await TagUser.exists({
      tagId: testTag3,
      userId: randomUser2?._id,
    });

    expect(tagAssignedToRandomUser1).toBeTruthy();
    expect(tagAssignedToRandomUser2).toBeTruthy();
  });

  it(`Should assign all the ancestor tags and returns the current tag`, async () => {
    // create a new tag with the organization
    const newTestTag = await OrganizationTagUser.create({
      name: "newTestTag",
      organizationId: testOrg1?._id,
    });

    // create random users and assign them this new test tag
    const randomUser1 = await createTestUser();
    const randomUser2 = await createTestUser();

    await Promise.all([
      User.findOneAndUpdate(
        {
          _id: randomUser1?._id,
        },
        {
          joinedOrganizations: testOrg1,
        },
      ),
      User.findOneAndUpdate(
        {
          _id: randomUser2?._id,
        },
        {
          joinedOrganizations: testOrg1,
        },
      ),
      TagUser.create({
        userId: randomUser1?._id,
        tagId: newTestTag?._id,
      }),
      TagUser.create({
        userId: randomUser2?._id,
        tagId: newTestTag?._id,
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

    const subTagAssignedToRandomUser1 = await TagUser.exists({
      tagId: testSubTag1?._id,
      userId: randomUser1?._id,
    });

    const subTagAssignedToRandomUser2 = await TagUser.exists({
      tagId: testSubTag1?._id,
      userId: randomUser2?._id,
    });

    expect(subTagAssignedToRandomUser1).toBeTruthy();
    expect(subTagAssignedToRandomUser2).toBeTruthy();

    const ancestorTagAssignedToRandomUser1 = await TagUser.exists({
      tagId: testTag?._id.toString() ?? "",
      userId: randomUser1?._id,
    });

    const ancestorTagAssignedToRandomUser2 = await TagUser.exists({
      tagId: testTag?._id.toString() ?? "",
      userId: randomUser2?._id,
    });

    expect(ancestorTagAssignedToRandomUser1).toBeTruthy();
    expect(ancestorTagAssignedToRandomUser2).toBeTruthy();
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
    const { assignToUserTags: assignToUserTags } = await import(
      "../../../src/resolvers/Mutation/assignToUserTags"
    );
    await assignToUserTags?.({}, args, context);
    throw new Error("Expected error was not thrown");
  } catch (error: unknown) {
    expect((error as Error).message).toEqual(`Translated ${expectedError}`);
    expect(spy).toHaveBeenLastCalledWith(expectedError);
  }
};
