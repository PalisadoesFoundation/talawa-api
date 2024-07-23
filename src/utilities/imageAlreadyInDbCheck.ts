import { imageHash } from "image-hash";
import { ImageHash } from "../models";
import { deleteDuplicatedImage } from "./deleteDuplicatedImage";
import { reuploadDuplicateCheck } from "./reuploadDuplicateCheck";
import { errors, requestContext } from "../libraries";
import { INVALID_FILE_TYPE } from "../constants";

/**
 * Checks if an image already exists in the database using its hash value.
 * If the image exists, it points to the existing image and removes the newly uploaded image.
 * If the image does not exist, it saves the image hash in the database.
 * @param oldImagePath - Path of the old image that might be replaced.
 * @param newImagePath - Path of the newly uploaded image.
 * @returns The file name of the existing image if found; otherwise, undefined.
 */
export const imageAlreadyInDbCheck = async (
  oldImagePath: string | null,
  newImagePath: string,
): Promise<string> => {
  try {
    let fileName;

    // Function to get the hash value of the new image
    const getImageHash = (): Promise<string> =>
      new Promise((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imageHash(`./${newImagePath}`, 16, true, (error: any, data: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
      });

    // Get the hash value of the new image
    const hash = await getImageHash();

    // Check if there is an existing image with the same hash value in the database
    const existingImageHash = await ImageHash.findOne({
      hashValue: hash,
    }).lean();

    if (!existingImageHash) {
      // If no existing image hash found, create a new entry in the ImageHash collection
      await ImageHash.create({
        hashValue: hash,
        fileName: newImagePath,
        numberOfUses: 1,
      });
    } else {
      // If an image with the same hash exists, perform duplicate check
      const imageIsDuplicate = await reuploadDuplicateCheck(
        oldImagePath,
        newImagePath,
      );

      if (imageIsDuplicate === false) {
        // Increment the number of uses if it's not a duplicate
        await ImageHash.updateOne(
          {
            // Increase the number of places this image is used
            hashValue: hash,
          },
          {
            $inc: {
              numberOfUses: 1,
            },
          },
        );
      }

      // Delete the newly uploaded image as it's a duplicate
      deleteDuplicatedImage(newImagePath);

      // Set the file name to the existing image's file name
      fileName = existingImageHash.fileName;
    }

    return fileName as string;
  } catch (error) {
    // Handle errors, such as invalid file types
    throw new errors.ValidationError(
      [
        {
          message: requestContext.translate(INVALID_FILE_TYPE.MESSAGE),
          code: INVALID_FILE_TYPE.CODE,
          param: INVALID_FILE_TYPE.PARAM,
        },
      ],
      requestContext.translate(INVALID_FILE_TYPE.MESSAGE),
    );
  }
};
