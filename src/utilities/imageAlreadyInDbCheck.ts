import { imageHash } from "image-hash";
import { ImageHash } from "../models";
import { deleteDuplicatedImage } from "./deleteDuplicatedImage";
import { reuploadDuplicateCheck } from "./reuploadDuplicateCheck";
import { errors, requestContext } from "../libraries";
import { INVALID_FILE_TYPE } from "../../src/constants";

/*
Check to see if image already exists in db using hash
if its there point to that image and remove the image just uploaded
if its not there allow the file to remain uploaded
*/
export const imageAlreadyInDbCheck = async (
  oldImagePath: string | null,
  newImagePath: string
) => {
  try {
    let fileName;

    const getImageHash = (): Promise<string> =>
      new Promise((resolve, reject) => {
        imageHash(`./${newImagePath}`, 16, true, (error: any, data: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
      });

    const hash = await getImageHash();

    const existingImageHash = await ImageHash.findOne({
      hashValue: hash,
    }).lean();

    if (!existingImageHash) {
      await ImageHash.create({
        hashValue: hash,
        fileName: newImagePath,
        numberOfUses: 1,
      });
    } else {
      const imageIsDuplicate = await reuploadDuplicateCheck(
        oldImagePath,
        newImagePath
      );

      if (imageIsDuplicate === false) {
        // dont increment if the same user/org is using the same image multiple times for the same use case
        await ImageHash.updateOne(
          {
            // Increase the number of places this image is used
            hashValue: hash,
          },
          {
            $inc: {
              numberOfUses: 1,
            },
          }
        );
      }

      deleteDuplicatedImage(newImagePath);

      fileName = existingImageHash.fileName; // will include have file already in db if pic is already saved will be null otherwise
    }

    return fileName;
  } catch (error) {
    throw new errors.ValidationError(
      [
        {
          message: requestContext.translate(INVALID_FILE_TYPE.message),
          code: INVALID_FILE_TYPE.code,
          param: INVALID_FILE_TYPE.param,
        },
      ],
      requestContext.translate("invalid.fileType")
    );
  }
};
