import "dotenv/config";
import { usersAssignedTo as usersAssignedToResolver } from "../../../src/resolvers/UserTag/usersAssignedTo";
import type {
  UsersConnectionResult,
  UserTagUsersAssignedToArgs,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserTagType } from "../../helpers/tags";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTagsAndAssignToUser } from "../../helpers/tags";
import { MAXIMUM_FETCH_LIMIT } from "../../../src/constants";
import { TagUser } from "../../../src/models";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testTag: TestUserTagType, testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , [testTag]] = await createTagsAndAssignToUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Tag -> usersAssignedTo", () => {
  it(`returns error object when the maximum fetch limit is exceeded`, async () => {
    const parent = testTag!;

    const args: UserTagUsersAssignedToArgs = {
      input: {
        limit: MAXIMUM_FETCH_LIMIT + 1,
        direction: "FORWARD",
      },
    };

    const payload = await usersAssignedToResolver?.(parent, args, {});

    expect(payload!.errors.length).toEqual(1);
    expect(payload!.errors[0]).toMatchObject({
      __typename: "MaximumValueError",
    });
    expect(payload!.data).toBeNull();
  });

  it(`returns error object when the cursor provided is invalid`, async () => {
    const parent = testTag!;

    const args: UserTagUsersAssignedToArgs = {
      input: {
        limit: MAXIMUM_FETCH_LIMIT,
        direction: "FORWARD",
        cursor: Types.ObjectId().toString(),
      },
    };

    const payload = await usersAssignedToResolver?.(parent, args, {});

    expect(payload!.errors.length).toEqual(1);
    expect(payload!.errors[0]).toMatchObject({
      __typename: "IncorrectCursor",
    });
    expect(payload!.data).toBeNull();
  });

  it(`returns correct connection object when the arguments are correct`, async () => {
    const parent = testTag!;

    const args: UserTagUsersAssignedToArgs = {
      input: {
        limit: MAXIMUM_FETCH_LIMIT,
        direction: "FORWARD",
      },
    };

    const payload = (await usersAssignedToResolver?.(
      parent,
      args,
      {}
    )) as UsersConnectionResult;

    expect(payload.errors.length).toEqual(0);
    expect(payload.data).not.toBeNull();

    const userTagObject = await TagUser.findOne({
      tagId: testTag!._id,
    });

    expect(payload.data!.pageInfo.startCursor).toEqual(
      userTagObject!._id.toString()
    );
    expect(payload.data!.pageInfo.endCursor).toEqual(
      userTagObject!._id.toString()
    );
    expect(payload.data!.edges[0].node._id).toEqual(testUser!._id);
  });
});
