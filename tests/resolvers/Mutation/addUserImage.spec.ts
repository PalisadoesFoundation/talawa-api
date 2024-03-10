import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
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
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import { addUserImage as addUserImageResolverUserImage } from "../../../src/resolvers/Mutation/addUserImage";
import type { MutationAddUserImageArgs } from "../../../src/types/generatedGraphQLTypes";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> addUserImage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddUserImageArgs = {
        file: "",
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { addUserImage: addUserImageResolverUserError } = await import(
        "../../../src/resolvers/Mutation/addUserImage"
      );

      await addUserImageResolverUserError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`When Image is given, updates current user's user object and returns the object when Image is not in DB path`, async () => {
    const args: MutationAddUserImageArgs = {
      file: "newImageFile.png",
    };
    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL,
    );
    const context = {
      userId: testUser?._id,
    };

    const addUserImagePayload = await addUserImageResolverUserImage?.(
      {},
      args,
      context,
    );
    // const testApp = await AppUserProfile.findOne({ userId: testUser?._id });
    // console.log(testApp);
    // console.log(addUserImagePayload, testUser?.appUserProfileId);
    expect(addUserImagePayload).toEqual({
      ...testUser?.toObject(),
      createdAt: addUserImagePayload?.createdAt,
      updatedAt: addUserImagePayload?.updatedAt,
      image: "newImageFile.png",
    });
  });
});
