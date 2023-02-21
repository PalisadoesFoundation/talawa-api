require("dotenv").config();
import fs from "fs";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../helpers/db";
import mongoose from "mongoose";
import { User } from "../../src/models";
import path from "path";
import {
  createTestUserAndOrganization,
  testUserType,
} from "../helpers/userAndOrg";

let testUser: testUserType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

try {
  beforeAll(async () => {
    MONGOOSE_INSTANCE = await connect();
    await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
    const testUserObj = await createTestUserAndOrganization();
    testUser = testUserObj[0];
    try {
      if (!fs.existsSync(path.join(__dirname, "../../images"))) {
        fs.mkdir(path.join(__dirname, "../../images"), (err) => {
          if (err) {
            throw err;
          }
        });
      }
    } catch (error) {
      console.log(error);
    }
  });

  afterAll(async () => {
    await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
    await disconnect(MONGOOSE_INSTANCE!);
  });

  describe("utilities -> uploadImage", () => {
    afterEach(async () => {
      vi.resetModules();
      vi.restoreAllMocks();
    });
    it("should create a new Image", async () => {
      try {
        const pngImage: any = {
          filename: "image.png",
          createReadStream: () => {
            return fs
              .createReadStream(
                path.join(__dirname, "../../image/talawa-logo-lite-200x200.png")
              )
              .on("error", (error) => {
                console.log(error);
              });
          },
        };
        const imageAlreadyInDbFile = await import(
          "../../src/utilities/imageAlreadyInDbCheck"
        );
        const mockedImageAlreadyInDb = vi
          .spyOn(imageAlreadyInDbFile, "imageAlreadyInDbCheck")
          .mockImplementation(
            async (oldImagePath: string | null, newImagePath: string) => {
              console.log(oldImagePath, newImagePath);
              return "";
            }
          );
        const { uploadImage } = await import("../../src/utilities/uploadImage");
        const uploadImagePayload = await uploadImage(pngImage, null);
        const testUserObj = await User.findByIdAndUpdate(
          {
            _id: testUser!.id,
          },
          {
            $set: {
              image: uploadImagePayload.newImagePath,
            },
          },
          {
            new: true,
          }
        ).lean();
        expect(mockedImageAlreadyInDb).toHaveBeenCalledWith(
          null,
          testUserObj?.image
        );
        expect(uploadImagePayload?.newImagePath).toEqual(testUserObj?.image);
        fs.unlink(
          path.join(
            __dirname,
            "../../".concat(uploadImagePayload.newImagePath)
          ),
          (err) => {
            if (err) throw err;
          }
        );
      } catch (error) {
        console.log(error);
      }
    });
    it("should create a new Image when an old Image Path already Exists", async () => {
      try {
        const pngImage: any = {
          filename: "image.png",
          createReadStream: () => {
            return fs
              .createReadStream(
                path.join(__dirname, "../../image/talawa-logo-lite-200x200.png")
              )
              .on("error", (err) => {
                console.log(err);
              });
          },
        };
        const imageAlreadyInDbFile = await import(
          "../../src/utilities/imageAlreadyInDbCheck"
        );
        const mockedImageAlreadyInDb = vi
          .spyOn(imageAlreadyInDbFile, "imageAlreadyInDbCheck")
          .mockImplementation(
            async (oldImagePath: string | null, newImagePath: string) => {
              console.log(oldImagePath, newImagePath);
              return newImagePath;
            }
          );
        const { uploadImage } = await import("../../src/utilities/uploadImage");
        const testUserBeforeObj = await User.findById({
          _id: testUser!.id,
        });
        const oldImagePath = testUserBeforeObj?.image!;
        console.log(oldImagePath);
        const deleteDuplicatedImage = await import(
          "../../src/utilities/deleteImage"
        );
        const mockedDeleteImage = vi
          .spyOn(deleteDuplicatedImage, "deleteImage")
          .mockImplementation(async () => {});
        const uploadImagePayload = await uploadImage(pngImage, oldImagePath);
        const testUserObj = await User.findByIdAndUpdate(
          {
            _id: testUser!.id,
          },
          {
            $set: {
              image: uploadImagePayload.newImagePath,
            },
          },
          {
            new: true,
          }
        ).lean();
        expect(mockedDeleteImage).toBeCalledWith(
          oldImagePath,
          testUserObj?.image
        );
        expect(mockedImageAlreadyInDb).toHaveBeenCalledWith(
          oldImagePath,
          testUserObj?.image
        );
        expect(uploadImagePayload?.newImagePath).toEqual(testUserObj?.image);
        fs.unlink(
          path.join(
            __dirname,
            "../../".concat(uploadImagePayload.newImagePath)
          ),
          (err) => {
            if (err) throw err;
          }
        );
      } catch (error) {
        console.log(error);
      }
    });
  });
} catch (error) {
  console.log(error);
}
