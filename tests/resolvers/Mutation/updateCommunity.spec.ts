import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateCommunityArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  PRELOGIN_IMAGERY_FIELD_EMPTY,
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { updateCommunity } from "../../../src/resolvers/Mutation/updateCommunity";
import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  vi,
  expect,
} from "vitest";
import type { TestUserType } from "../../helpers/user";
import { createTestUserWithUserTypeFunc } from "../../helpers/user";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser1: TestUserType;
let testUser2: TestUserType;

const args: MutationUpdateCommunityArgs = {
  data: {
    logo: "image.png",
    name: "testName",
    socialMediaUrls: {
      facebook: "http://testurl.com",
      gitHub: "http://testurl.com",
      instagram: "http://testurl.com",
      linkedIn: "http://testurl.com",
      reddit: "http://testurl.com",
      slack: "http://testurl.com",
      twitter: "http://testurl.com",
      youTube: "http://testurl.com",
    },
    websiteLink: "http://testlink.com",
  },
};

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser1 = await createTestUserWithUserTypeFunc("SUPERADMIN");
  testUser2 = await createTestUserWithUserTypeFunc("USER");
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> updateCommunity", () => {
  it(`throws NotFoundError if no user exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { updateCommunity: updateCommunityResolver } = await import(
        "../../../src/resolvers/Mutation/updateCommunity"
      );

      await updateCommunityResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not superadmin with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const context = {
        userId: testUser2?._id,
      };

      const { updateCommunity: updateCommunityResolver } = await import(
        "../../../src/resolvers/Mutation/updateCommunity"
      );
      await updateCommunityResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`,
      );
    }
  });

  it(`throws field cannot be empty error if websiteName, websiteLink or logo in passed empty`, async () => {
    const args: MutationUpdateCommunityArgs = {
      data: {
        logo: "",
        name: "",
        socialMediaUrls: {
          facebook: "",
          gitHub: "",
          instagram: "",
          linkedIn: "",
          reddit: "",
          slack: "",
          twitter: "",
          youTube: "",
        },
        websiteLink: "",
      },
    };

    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const context = {
        userId: testUser1?._id,
      };

      const { updateCommunity: updateCommunityResolver } = await import(
        "../../../src/resolvers/Mutation/updateCommunity"
      );
      await updateCommunityResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(PRELOGIN_IMAGERY_FIELD_EMPTY.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${PRELOGIN_IMAGERY_FIELD_EMPTY.MESSAGE}`,
      );
    }
  });

  it(`should upload the data and return true`, async () => {
    const context = {
      userId: testUser1?._id,
    };

    const updatedCommunityPayload = await updateCommunity?.({}, args, context);

    expect(updatedCommunityPayload).toBeTruthy();
  });

  it(`should delete the previous data, upload the new data and return true`, async () => {
    const context = {
      userId: testUser1?._id,
    };

    const updatedCommunityPayload = await updateCommunity?.({}, args, context);

    expect(updatedCommunityPayload).toBeTruthy();
  });
});
