/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { ImageHash } from "../../src/models";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { connect, disconnect } from "../helpers/db";
import type mongoose from "mongoose";
import { nanoid } from "nanoid";
import { INVALID_FILE_TYPE } from "../../src/constants";

const testNewImagePath = `${nanoid()}-testNewImagePath`;
const testOldImagePath = `${nanoid()}-testOldImagePath`;
const testHash = `${nanoid()}-testHash`;
const testDifferentHash = `${nanoid()}-testDifferentHash`;
let MONGOOSE_INSTANCE: typeof mongoose;
const testMessage = "invalid.fileType";

const testErrors = [
  {
    message: INVALID_FILE_TYPE.MESSAGE,
    code: INVALID_FILE_TYPE.CODE,
    param: INVALID_FILE_TYPE.PARAM,
  },
];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("utilities -> imageAlreadyInDbCheck", () => {
  afterEach(async () => {
    vi.doUnmock("image-hash");
    vi.resetModules();
    vi.restoreAllMocks();

    await ImageHash.deleteOne({
      hashValue: testHash,
    });
  });

  it("creates ImageHash instance and returns fileName as undefined if existingImageHash === null", async () => {
    vi.doMock("image-hash", () => {
      return {
        imageHash: (...args: any): any => {
          const callBack = args[3];

          return callBack(null, testHash);
        },
      };
    });

    const { imageAlreadyInDbCheck } = await import(
      "../../src/utilities/imageAlreadyInDbCheck"
    );

    const fileName = await imageAlreadyInDbCheck(null, testNewImagePath);

    const imageHashCreated = await ImageHash.findOne({
      hashValue: testHash,
    });

    expect(fileName).toBeUndefined();
    expect(imageHashCreated?.numberOfUses).toEqual(1);
    expect(imageHashCreated?.fileName).toEqual(testNewImagePath);
    expect(imageHashCreated?.hashValue).toEqual(testHash);
  });

  it("calls deleteDuplicatedImage and returns fileName as existingImageHash.fileName if existingImageHash !== null and imageHash(oldImagePath) === imageHash(newImagePath)", async () => {
    vi.doMock("image-hash", () => {
      return {
        imageHash: (...args: any): any => {
          const callBack = args[3];

          return callBack(null, testHash);
        },
      };
    });

    await ImageHash.create({
      hashValue: testHash,
      fileName: testOldImagePath,
      numberOfUses: 1,
    });

    const deleteDuplicatedImage = await import(
      "../../src/utilities/deleteDuplicatedImage"
    );

    const mockedDeleteDuplicateImage = vi
      .spyOn(deleteDuplicatedImage, "deleteDuplicatedImage")
      .mockImplementation(() => undefined);

    const { imageAlreadyInDbCheck } = await import(
      "../../src/utilities/imageAlreadyInDbCheck"
    );

    const fileName = await imageAlreadyInDbCheck(
      testOldImagePath,
      testNewImagePath,
    );

    expect(fileName).toEqual(testOldImagePath);
    expect(mockedDeleteDuplicateImage).toBeCalledWith(testNewImagePath);
  });

  it("calls deleteDuplicatedImage and returns fileName as existingImageHash.fileName if existingImageHash !== null and imageHash(oldImagePath) !== imageHash(newImagePath)", async () => {
    vi.doMock("image-hash", () => {
      return {
        imageHash: (...args: any): any => {
          const callBack = args[3];
          let imagePath: string = args[0];

          if (imagePath.indexOf("./") !== -1) {
            imagePath = imagePath.slice(2);
          }

          if (imagePath === testNewImagePath) {
            return callBack(null, testHash);
          }

          return callBack(null, testDifferentHash);
        },
      };
    });

    await ImageHash.create({
      hashValue: testHash,
      fileName: testOldImagePath,
      numberOfUses: 1,
    });

    const deleteDuplicatedImage = await import(
      "../../src/utilities/deleteDuplicatedImage"
    );

    const mockedDeleteDuplicateImage = vi
      .spyOn(deleteDuplicatedImage, "deleteDuplicatedImage")
      .mockImplementation(() => undefined);

    const { imageAlreadyInDbCheck } = await import(
      "../../src/utilities/imageAlreadyInDbCheck"
    );

    const fileName = await imageAlreadyInDbCheck(
      testOldImagePath,
      testNewImagePath,
    );

    const existingImageHash = await ImageHash.findOne({
      hashValue: testHash,
    }).lean();

    expect(fileName).toEqual(testOldImagePath);
    expect(mockedDeleteDuplicateImage).toBeCalledWith(testNewImagePath);
    expect(existingImageHash?.numberOfUses).toEqual(2);
  });

  it("throws ValidationError if imageHash callbacks with error !== null", async () => {
    vi.doMock("image-hash", () => {
      return {
        imageHash: (...args: any): any => {
          const callBack = args[3];

          return callBack("testError", null);
        },
      };
    });

    const { requestContext } = await import("../../src/libraries");

    const mockedRequestTranslate = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => {
        return message;
      });

    const { imageAlreadyInDbCheck } = await import(
      "../../src/utilities/imageAlreadyInDbCheck"
    );

    try {
      await imageAlreadyInDbCheck(null, testNewImagePath);
    } catch (error: any) {
      expect(error.message).toEqual(testMessage);
      expect(error.errors).toEqual(testErrors);
    }

    expect(mockedRequestTranslate).toBeCalledWith("invalid.fileType");
  });
});
