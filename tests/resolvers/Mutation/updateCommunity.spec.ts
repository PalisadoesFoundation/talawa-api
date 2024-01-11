import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Community } from "../../../src/models";
import type { MutationUpdateCommunityArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  COMMUNITY_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
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
import type { TestCommunityType } from "../../helpers/community";
import { createTestUserWithUserTypeFunc } from "../../helpers/user";
import { createTestCommunityFunc } from "../../helpers/community";
import { errors } from "../../../src/libraries";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser1: TestUserType;
let testUser2: TestUserType;
let testCommunity: TestCommunityType;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser1 = await createTestUserWithUserTypeFunc("SUPERADMIN");
  testUser2 = await createTestUserWithUserTypeFunc("USER");
  testCommunity = await createTestCommunityFunc();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
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
      const args: MutationUpdateCommunityArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await updateCommunity?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
        );
      }
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not superadmin with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateCommunityArgs = {
        id: testCommunity?._id,
      };

      const context = {
        userId: testUser1?._id,
      };

      await updateCommunity?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
        );
      }
    }
  });

  it(`throws NotFoundError if no community exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateCommunityArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser1?._id,
      };

      await updateCommunity?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        // expect(spy).toHaveBeenCalledWith(COMMUNITY_NOT_FOUND_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${COMMUNITY_NOT_FOUND_ERROR.MESSAGE}`
        );
      }
    }
  });

  it(`updates the community with _id === args.id and returns the updated community`, async () => {
    const args: MutationUpdateCommunityArgs = {
      id: testCommunity?._id,
      data: {
        description: "newDescription",
        name: "newName",
        websiteLink: "newWebsiteLink",
        socialMediaUrls: {
          facebook: "newFacebook",
          gitHub: "newGitHub",
          linkedIn: "newLinkedIn",
          reddit: "newReddit",
          slack: "newSlack",
          twitter: "newTwitter",
          youTube: "newYouTube",
        },
      },
    };

    const context = {
      userId: testUser1?._id,
    };

    const updatedCommunityPayload = await updateCommunity?.({}, args, context);

    const testUpdateCommunityPayload = await Community.findOne({
      _id: testCommunity?._id,
    }).lean();

    expect(JSON.parse(JSON.stringify(updatedCommunityPayload))).toEqual(
      JSON.parse(JSON.stringify(testUpdateCommunityPayload))
    );
  });

  it(`updates the organization with _id === args.id and returns the updated organization when image is given`, async () => {
    const args: MutationUpdateCommunityArgs = {
      id: testCommunity?._id,
      data: {
        description: "newDescription",
        name: "newName",
      },
      file: "newImageFile.png",
    };

    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL
    );

    const context = {
      userId: testUser1?._id,
    };

    const updatedCommunityPayload = await updateCommunity?.({}, args, context);

    const testUpdateCommunityPayload = await Community.findOne({
      _id: testCommunity?._id,
    }).lean();

    expect(JSON.parse(JSON.stringify(updatedCommunityPayload))).toEqual(
      JSON.parse(JSON.stringify(testUpdateCommunityPayload))
    );
  });
});
