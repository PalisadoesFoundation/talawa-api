import "dotenv/config";
import { Types } from "mongoose";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { MutationAddUserImageArgs } from "../../../src/types/generatedGraphQLTypes";
import { USER_NOT_FOUND_MESSAGE } from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import { testUserType, createTestUser } from "../../helpers/userAndOrg";

let testUser: testUserType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> addUserImage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no user exists with _id === context.userId // IN_PRODUCTION=true`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddUserImageArgs = {
        file: "",
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
      const { addUserImage: addUserImageResolverUserError } = await import(
        "../../../src/resolvers/Mutation/addUserImage"
      );
      await addUserImageResolverUserError?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });
  it(`When Image is given, updates current user's user object and returns the object when Image is  in DB path`, async () => {
    const uploadImage = await import("../../../src/utilities");

    const spy = vi
      .spyOn(uploadImage, "uploadImage")
      .mockImplementationOnce(async () => {
        return {
          newImagePath: "newImagePath",
          imageAlreadyInDbPath: "imageAlreadyInDbPath",
        };
      });

    const args: MutationAddUserImageArgs = {
      file: "newImageFile.png",
    };

    const context = {
      userId: testUser!._id,
    };

    const { addUserImage: addUserImageResolverUserError } = await import(
      "../../../src/resolvers/Mutation/addUserImage"
    );
    const addUserImagePayload = await addUserImageResolverUserError?.(
      {},
      args,
      context
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(addUserImagePayload).toEqual({
      ...testUser!.toObject(),

      image: "imageAlreadyInDbPath",
    });
  });
  it(`When Image is given, updates current user's user object and returns the object when Image is not in DB path`, async () => {
    const uploadImage = await import("../../../src/utilities");

    const spy = vi
      .spyOn(uploadImage, "uploadImage")
      .mockImplementationOnce(async () => {
        return {
          newImagePath: "newImagePath",
          imageAlreadyInDbPath: "",
        };
      });

    const args: MutationAddUserImageArgs = {
      file: "newImageFile.png",
    };

    const context = {
      userId: testUser!._id,
    };

    const { addUserImage: addUserImageResolverUserError } = await import(
      "../../../src/resolvers/Mutation/addUserImage"
    );
    const addUserImagePayload = await addUserImageResolverUserError?.(
      {},
      args,
      context
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(addUserImagePayload).toEqual({
      ...testUser!.toObject(),

      image: "newImagePath",
    });
  });
});
