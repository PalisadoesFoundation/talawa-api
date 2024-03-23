/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
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
import { ApplicationError } from "../../src/libraries/errors";
dotenv.config();

const testNewImagePath = `${nanoid()}-testNewImagePath`;
const testOldImagePath = `${nanoid()}-testOldImagePath`;
const testNewImageHash = `${nanoid()}-testHash`;

const testErrors = [
  {
    message: "invalid.fileType",
    code: "invalid.fileType",
    param: "fileType",
  },
];

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("utilities -> reuploadDuplicateCheck", () => {
  afterEach(() => {
    vi.doUnmock("image-hash");
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("should return true when uploaded image hash = old image hash", async () => {
    vi.doMock("image-hash", () => {
      return {
        imageHash: (...args: any): any => {
          const callBack = args[3];

          return callBack(null, testNewImageHash);
        },
      };
    });

    await ImageHash.create({
      hashValue: testNewImageHash,
      fileName: testNewImagePath,
      numberOfUses: 1,
    });

    const testNewImagePathCopy = testNewImagePath;

    const { reuploadDuplicateCheck } = await import(
      "../../src/utilities/reuploadDuplicateCheck"
    );

    const reuploadDuplicateCheckPayload = await reuploadDuplicateCheck(
      testNewImagePathCopy,
      testNewImagePath,
    );

    expect(reuploadDuplicateCheckPayload).toBe(true);
  });

  it("should return false when oldImagePath= null", async () => {
    const { reuploadDuplicateCheck } = await import(
      "../../src/utilities/reuploadDuplicateCheck"
    );

    const reuploadDuplicateCheckPayload = await reuploadDuplicateCheck(
      null,
      testNewImagePath,
    );

    expect(reuploadDuplicateCheckPayload).toBe(false);
  });

  it("should throw an error when getting image-hash ", async () => {
    try {
      const { reuploadDuplicateCheck } = await import(
        "../../src/utilities/reuploadDuplicateCheck"
      );

      await reuploadDuplicateCheck(testOldImagePath, testNewImagePath);
    } catch (error) {
      expect(error).not.toBe(null);
    }
  });

  it("should throw invalid file type error", async () => {
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

    try {
      const { reuploadDuplicateCheck } = await import(
        "../../src/utilities/reuploadDuplicateCheck"
      );

      await reuploadDuplicateCheck(null, testNewImagePath);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(error.message).toEqual("invalid.fileType");
      expect(error.errors).toEqual(testErrors);
      expect(mockedRequestTranslate).toBeCalledWith("invalid.fileType");
    }
  });
});
