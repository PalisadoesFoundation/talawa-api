/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
import { nanoid } from "nanoid";
import * as fs from "fs";
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
import type { Document } from "mongoose";
import type mongoose from "mongoose";
dotenv.config();

import type { InterfaceImageHash } from "../../src/models";
import { ImageHash } from "../../src/models";

const testImageToBeDeleted = `${nanoid()}-testNewImagePath`;
const testOldImagePath = `${nanoid()}-testOldImagePath`;
const testHashString = `${nanoid()}-testHash`;

let MONGOOSE_INSTANCE: typeof mongoose;
let testHash: InterfaceImageHash & Document<any, any, InterfaceImageHash>;

vi.mock("fs", () => ({
  unlink: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testHash = await ImageHash.create({
    fileName: testImageToBeDeleted,
    hashValue: testHashString,
    numberOfUses: 1,
  });
});

afterAll(async () => {
  await ImageHash.deleteMany({});
  await disconnect(MONGOOSE_INSTANCE);
});

describe("utilities -> deleteImage.ts", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("should delete Image when numberOfUser <=1", async () => {
    vi.spyOn(fs, "unlink").mockImplementationOnce(
      (_imagePath: any, callback: any) => callback(null),
    );
    const reuploadUtilities = await import(
      "../../src/utilities/reuploadDuplicateCheck"
    );

    vi.spyOn(reuploadUtilities, "reuploadDuplicateCheck").mockImplementation(
      async () => {
        return false;
      },
    );
    const { logger } = await import("../../src/libraries");

    const logSpy = vi.spyOn(logger, "info");

    const { deleteImage } = await import("../../src/utilities/deleteImage");

    await deleteImage(testImageToBeDeleted, testOldImagePath);

    const testHashObj = await ImageHash.findById({ _id: testHash._id });

    expect(fs.unlink).toBeCalledWith(
      testImageToBeDeleted,
      expect.any(Function),
    );
    expect(logSpy).toBeCalledWith(
      "Image is only used once and therefore can be deleted",
    );
    expect(logSpy).toBeCalledWith("File deleted!");
    expect(testHashObj?.toObject()).toEqual({
      ...testHashObj?.toObject(),
      numberOfUses: 0,
    });
  });

  it("should not delete Image when numberOfUser > 1", async () => {
    await ImageHash.findByIdAndUpdate(
      {
        _id: testHash._id,
      },
      {
        $set: {
          numberOfUses: 2,
        },
      },
      {
        new: true,
      },
    );

    const reuploadUtilities = await import(
      "../../src/utilities/reuploadDuplicateCheck"
    );

    vi.spyOn(reuploadUtilities, "reuploadDuplicateCheck").mockImplementation(
      async () => {
        return false;
      },
    );
    const { logger } = await import("../../src/libraries");

    const logSpy = vi.spyOn(logger, "info");

    const { deleteImage } = await import("../../src/utilities/deleteImage");

    await deleteImage(testImageToBeDeleted, testOldImagePath);

    const testHashObj = await ImageHash.findById({ _id: testHash._id });

    expect(logSpy).toHaveBeenCalled();
    expect(logSpy).toBeCalledWith("Image cannot be deleted");
    expect(testHashObj?.toObject()).toEqual({
      ...testHashObj?.toObject(),
      numberOfUses: 1,
    });
  });

  it("should throw error", async () => {
    try {
      await ImageHash.findByIdAndUpdate(
        {
          _id: testHash._id,
        },
        {
          $set: {
            numberOfUses: 1,
          },
        },
        {
          new: true,
        },
      );

      const error = new Error("There was an error deleting the file.");
      vi.spyOn(fs, "unlink").mockImplementationOnce(
        (_imagePath: any, callback: any) => callback(error),
      );

      const reuploadUtilities = await import(
        "../../src/utilities/reuploadDuplicateCheck"
      );

      vi.spyOn(reuploadUtilities, "reuploadDuplicateCheck").mockImplementation(
        async () => {
          return false;
        },
      );

      const { logger } = await import("../../src/libraries");

      const logSpy = vi.spyOn(logger, "info");

      const { deleteImage } = await import("../../src/utilities/deleteImage");

      await deleteImage(testImageToBeDeleted, testOldImagePath);

      expect(fs.unlink).toBeCalledWith(
        testImageToBeDeleted,
        expect.any(Function),
      );
      expect(logSpy).not.toBeCalled();
    } catch (error: unknown) {
      expect(error).not.toBe(null);
    }
  });
});
