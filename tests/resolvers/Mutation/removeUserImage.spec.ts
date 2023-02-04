import "dotenv/config";
import { Document, Types } from "mongoose";
import { Interface_User, User } from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { USER_NOT_FOUND, USER_NOT_FOUND_MESSAGE } from "../../../src/constants";
import { nanoid } from "nanoid";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
const testImage: string = "testImage";

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> removeUserImage", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId and IN_PRODUCTION === false`, async () => {
    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: false,
        };
      });

      const { removeUserImage: removeUserImageResolver } = await import(
        "../../../src/resolvers/Mutation/removeUserImage"
      );

      await removeUserImageResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId and IN_PRODUCTION === true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
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

      const { removeUserImage: removeUserImageResolver } = await import(
        "../../../src/resolvers/Mutation/removeUserImage"
      );

      await removeUserImageResolver?.({}, {}, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });

  it(`throws NotFoundError if no user.image exists for currentUser
  with _id === context.userId and IN_PRODUCTION === false`, async () => {
    try {
      const context = {
        userId: testUser.id,
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: false,
        };
      });

      const { removeUserImage: removeUserImageResolver } = await import(
        "../../../src/resolvers/Mutation/removeUserImage"
      );

      await removeUserImageResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual("User profile image not found");
    }
  });

  it(`throws NotFoundError if no user.image exists for currentUser
  with _id === context.userId and IN_PRODUCTION === true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const context = {
        userId: testUser.id,
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

      const { removeUserImage: removeUserImageResolver } = await import(
        "../../../src/resolvers/Mutation/removeUserImage"
      );

      await removeUserImageResolver?.({}, {}, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith("user.profileImage.notFound");
      expect(error.message).toEqual(`Translated user.profileImage.notFound`);
    }
  });

  it(`sets image field to null for organization with _id === args.organizationId
  and returns the updated user`, async () => {
    const utilities = await import("../../../src/utilities");

    const deleteImageSpy = vi
      .spyOn(utilities, "deleteImage")
      .mockImplementation((_imageToBeDeleted: string) => {
        return Promise.resolve();
      });

    await User.updateOne(
      {
        _id: testUser._id,
      },
      {
        $set: {
          image: testImage,
        },
      }
    );

    const context = {
      userId: testUser._id,
    };

    const { removeUserImage: removeUserImageResolver } = await import(
      "../../../src/resolvers/Mutation/removeUserImage"
    );

    const removeUserImagePayload = await removeUserImageResolver?.(
      {},
      {},
      context
    );

    const updatedTestUser = await User.findOne({
      _id: testUser._id,
    }).lean();

    expect(removeUserImagePayload).toEqual(updatedTestUser);
    expect(deleteImageSpy).toBeCalledWith(testImage);
    expect(removeUserImagePayload?.image).toEqual(null);
  });
});
