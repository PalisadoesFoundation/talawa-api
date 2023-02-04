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
import { connect, disconnect } from "../../src/db";
import { User } from "../../src/models";
import path from "path";
import {
  createTestUserAndOrganization,
  testUserType,
} from "../helpers/userAndOrg";

let testUser: testUserType;

beforeAll(async () => {
  await connect();
  const testUserObj = await createTestUserAndOrganization();
  testUser = testUserObj[0];
  if (!fs.existsSync(path.join(__dirname, "../../images"))) {
    fs.mkdir(path.join(__dirname, "../../images"), (err) => {
      if (err) {
        throw err;
      }
    });
  }
  const img =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0" +
    "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO" +
    "3gAAAABJRU5ErkJggg==";
  const data = img.replace(/^data:image\/\w+;base64,/, "");
  const buf = Buffer.from(data, "base64");
  await fs.writeFile(
    path.join(__dirname, "../../images/image.png"),
    buf,
    (error) => {
      if (error) console.log(error);
    }
  );
});

afterAll(async () => {
  try {
    fs.unlink(path.join(__dirname, "../../images/image.png"), (err) => {
      if (err) throw err;
    });
  } catch (error) {
    console.log(error);
  }

  await disconnect();
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
          return fs.createReadStream(
            path.join(__dirname, "../../images/image.png")
          );
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
        path.join(__dirname, "../../".concat(uploadImagePayload.newImagePath)),
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
          return fs.createReadStream(
            path.join(__dirname, "../../images/image.png")
          );
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
        path.join(__dirname, "../../".concat(uploadImagePayload.newImagePath)),
        (err) => {
          if (err) throw err;
        }
      );
    } catch (error) {
      console.log(error);
    }
  });
});
