import "dotenv/config";
import { usersAssignedTo as usersAssignedToResolver } from "../../../src/resolvers/Tag/usersAssignedTo";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testTagType,
  createAndAssignUsersToTag,
  createTwoLevelTagsWithOrg,
} from "../../helpers/tags";
import { TagUser, User } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testRootTag: testTagType, testChildTag1: testTagType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , [testRootTag, testChildTag1]] = await createTwoLevelTagsWithOrg();
  await createAndAssignUsersToTag(testRootTag, 4);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Tag -> usersAssignedTo", () => {
  it(`returns the list of assigned user object`, async () => {
    const parent = testRootTag!.toObject();

    const payload = await usersAssignedToResolver?.(parent, {}, {});

    // Getting all the assigned users
    const allUsers = await TagUser.find({
      tagId: parent._id,
      objectType: "USER",
    })
      .select({
        objectId: 1,
      })
      .lean();

    const allUserIds = allUsers.map((user) => user.objectId);

    const testUsers = await User.find({
      _id: {
        $in: allUserIds,
      },
    });

    // The recieved payload should match the fetched users
    expect(payload).toEqual(testUsers);
  });

  it(`returns empty list if no user is assigned to the tag`, async () => {
    const parent = testChildTag1!.toObject();

    const payload = await usersAssignedToResolver?.(parent, {}, {});

    expect(payload).toEqual([]);
  });
});
