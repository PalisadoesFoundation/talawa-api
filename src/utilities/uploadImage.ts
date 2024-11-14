import { createWriteStream } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { logger } from "../libraries";
import { imageAlreadyInDbCheck } from "./imageAlreadyInDbCheck";
import { deleteImage } from "./deleteImage";
import { imageExtensionCheck } from "./imageExtensionCheck";

/**
 * Uploads a new image, deletes the previously uploaded image if it exists, and checks for duplicates in the database.
 * @remarks
 * This is a utility method.
 * @param newImageFile - File object of the new image with `TypeNewImageFile` type.
 * @param oldImagePath - Path of the current image to be replaced. Can be `null` if no image exists.
 * @returns An object containing paths of the newly uploaded image and any duplicate image found in the database.
 */
type TypeNewImageFile = {
  createReadStream: () => NodeJS.ReadStream;
  filename: string;
};

export const uploadImage = async (
  newImageFile: TypeNewImageFile,
  oldImagePath: string | null,
): Promise<{ newImagePath: string; imageAlreadyInDbPath: string }> => {
  // Generate a unique ID for the new image file
  const id = nanoid();

  // Extract filename from new image file
  const { createReadStream, filename } = await newImageFile;

  // Validate image file extension (must be PNG or JPG)
  await imageExtensionCheck(filename);

  // upload new image
  await new Promise((resolve, reject) =>
    createReadStream()
      .pipe(
        createWriteStream(
          path.join(__dirname, "../../images", `/${id}-${filename}`),
        ),
      )
      .on("close", resolve)
      .on("error", (error: Error) => reject(error))
      .on("finish", () =>
        resolve({
          path,
        }),
      ),
  );

  const newImagePath = `images/${id}-${filename}`;

  // If there is an old image path, delete it and perform duplicate check
  if (oldImagePath !== null) {
    console.log("oldImagePath is not null");

    logger.info("old image should be deleted");

    // If user/organization already has an image delete it from the API
    await deleteImage(oldImagePath, newImagePath);
  }

  // Check if the newly uploaded image already exists in the database
  const imageAlreadyInDbPath = await imageAlreadyInDbCheck(
    oldImagePath,
    newImagePath,
  );

  // Return paths of the newly uploaded image and any duplicate found in the database
  return {
    newImagePath,
    imageAlreadyInDbPath,
  };
};
