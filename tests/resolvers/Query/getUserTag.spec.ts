import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";

import { getUserTag as getUserTagResolver } from "../../../src/resolvers/Query/getUserTag";
import type { QueryGetUserTagArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createRootTagWithOrg, type TestUserTagType } from "../../helpers/tags";
import { TAG_NOT_FOUND } from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose;

let testTag: TestUserTagType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , testTag] = await createRootTagWithOrg();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getUserTag", () => {
  it(`throws NotFoundError if no userTag exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: QueryGetUserTagArgs = {
        id: new Types.ObjectId().toString(),
      };

      await getUserTagResolver?.({}, args, {});
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(TAG_NOT_FOUND.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${TAG_NOT_FOUND.MESSAGE}`,
      );
    }
  });

  it(`returns the tag with _id === args.id`, async () => {
    const args: QueryGetUserTagArgs = {
      id: testTag?._id.toString() ?? "",
    };

    const getUserTagPayload = await getUserTagResolver?.({}, args, {});

    expect(getUserTagPayload).toEqual(testTag);
  });
});
