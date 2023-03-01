import "dotenv/config";
import { Types } from "mongoose";
import { Organization } from "../../../src/models";
import { MutationTogglePinnedPostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import {
  POST_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED_TO_PIN,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import { createTestPost, testPostType } from "../../helpers/posts";
import { createTestUser, testUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let randomUser: testUserType;
let testPost: testPostType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testPost] = await createTestPost();
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> togglePinnedPost", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`throws NotFoundError if current user with _id === context.userId does not exist`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    try {
      const args: MutationTogglePinnedPostArgs = {
        id: testPost!._id,
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
          IN_PRODUCTION: true,
        };
      });

      const { togglePinnedPost: togglePinnedPostResolver } = await import(
        "../../../src/resolvers/Mutation/togglePinnedPost"
      );

      await togglePinnedPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    try {
      const args: MutationTogglePinnedPostArgs = {
        id: Types.ObjectId().toString(),
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });

      const context = {
        userId: testUser!._id,
      };

      const { togglePinnedPost: togglePinnedPostResolver } = await import(
        "../../../src/resolvers/Mutation/togglePinnedPost"
      );

      await togglePinnedPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(`Translated ${POST_NOT_FOUND_MESSAGE}`);
    }
  });

  it(`throws NotAuthorized error if the user is not the admin of the org or a superadmin`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);
    try {
      const args: MutationTogglePinnedPostArgs = {
        id: testPost!.id,
      };

      const context = {
        userId: randomUser!._id,
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });

      const { togglePinnedPost: togglePinnedPostResolver } = await import(
        "../../../src/resolvers/Mutation/togglePinnedPost"
      );

      await togglePinnedPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_TO_PIN.message);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_TO_PIN.message}`
      );
    }
  });

  it(`adds a post to the pinnedPosts for an org`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );
    const args: MutationTogglePinnedPostArgs = {
      id: testPost!._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const { togglePinnedPost: togglePinnedPostResolver } = await import(
      "../../../src/resolvers/Mutation/togglePinnedPost"
    );

    await togglePinnedPostResolver?.({}, args, context);
    const organization = await Organization.findOne({
      _id: testPost!.organization,
    }).lean();

    const currentPostIsPinned = organization!.pinnedPosts.some(
      (p) => p.toString() === args.id.toString()
    );

    expect(currentPostIsPinned).toBeTruthy();
  });

  it(`removes a post from the pinnedPosts for an org`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    const args: MutationTogglePinnedPostArgs = {
      id: testPost!._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const { togglePinnedPost: togglePinnedPostResolver } = await import(
      "../../../src/resolvers/Mutation/togglePinnedPost"
    );

    await togglePinnedPostResolver?.({}, args, context);

    const organization = await Organization.findOne({
      _id: testPost!.organization,
    }).lean();

    const currentPostIsPinned = organization!.pinnedPosts.some(
      (p) => p.toString() === args.id.toString()
    );

    expect(currentPostIsPinned).toBeFalsy();
  });
});
