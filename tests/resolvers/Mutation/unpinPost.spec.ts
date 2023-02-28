import "dotenv/config";
import { Types } from "mongoose";
import { MutationUnpinPostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { unpinPost as unpinPostResolver } from "../../../src/resolvers/Mutation/unpinPost";
import {
  POST_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import { testUserType } from "../../helpers/userAndOrg";
import { createTestPost, testPostType } from "../../helpers/posts";

let testUser: testUserType;
let testPost: testPostType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testPost] = await createTestPost(true);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> unpinPost", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationUnpinPostArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };
      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });
      const { unpinPost: pinPostResolver } = await import(
        "../../../src/resolvers/Mutation/unpinPost"
      );

      await pinPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationUnpinPostArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };
      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });

      const { unpinPost: unpinPostResolver } = await import(
        "../../../src/resolvers/Mutation/unpinPost"
      );

      await unpinPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(POST_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(POST_NOT_FOUND_MESSAGE);
    }
  });

  it(`updates the pinned status of the post and returns it `, async () => {
    const args: MutationUnpinPostArgs = {
      id: testPost!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const pinPostPayload = await unpinPostResolver?.({}, args, context);

    expect(pinPostPayload?.pinned).toEqual(false);
  });
});
