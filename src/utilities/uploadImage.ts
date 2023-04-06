import { createWriteStream } from "fs";
import path from "path";
import shortid from "shortid";
import { logger } from "../libraries";
import { imageAlreadyInDbCheck } from "./imageAlreadyInDbCheck";
import { deleteImage } from "./deleteImage";
import { imageExtensionCheck } from "./imageExtensionCheck";

interface Interface_NewImage {
  createReadStream: () => any;
  filename: string;
}

/**
 * This function uploads the new image and deletes the previously uploaded image if exists.
 * @remarks
 * This is a utility method.
 * @param newImageFile - File of a new Image with `any` type.
 * @param oldImagePath - File of a current Image. It can be `null`.
 * @returns Path of an uploaded image.
 */
export const uploadImage = async (
  newImageFile: Interface_NewImage | null,
  oldImagePath: string | null
) => {
  if (!newImageFile) {
    throw new Error("newImageFile is empty or null");
  }
  const id = shortid.generate();

  const { createReadStream, filename } = await newImageFile;

  // throw an error if file is not png or jpg
  await imageExtensionCheck(filename);
  try {
    const writeStream = createWriteStream(
      path.join(__dirname, "../../images", `/${id}-${filename}`)
    );

    // handle errors during the upload process
    writeStream.on("error", (error: Error) => {
      throw new Error(`Error uploading files: ${error.message}`);
    });

    // upload new image
    await new Promise((resolve, reject) => {
      createReadStream()
        .pipe(writeStream)
        .on("close", resolve)
        .on("finish", resolve)
        .on("error", (error: Error) => {
          reject(`Error uploading file: ${error.message}`);
        });
    });
    const newImagePath = `images/${id}-${filename}`;

    if (oldImagePath !== null) {
      console.log("oldImagePath is not null");
      logger.info("Deleting old image");

      // If user/organization already has an image delete it from the API
      await deleteImage(oldImagePath, newImagePath);
    }

    const imageAlreadyInDbPath = await imageAlreadyInDbCheck(
      oldImagePath,
      newImagePath
    );

    return {
      newImagePath,
      imageAlreadyInDbPath,
    };
  } catch (error) {
    logger.error("Error uploading file ", error);
  }
};
