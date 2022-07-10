import { imageHash } from 'image-hash';
import { ImageHash } from '../models';
import { deleteDuplicatedImage } from './deleteDuplicatedImage';
import { reuploadDuplicateCheck } from './reuploadDuplicateCheck';
import { ValidationError } from '../libraries/errors';
import requestContext from '../libraries/request-context';

/*
Check to see if image already exists in db using hash
if its there point to that image and remove the image just uploaded
if its not there allow the file to remain uploaded
*/
export const imageAlreadyInDbCheck = async (
  imageJustUploadedPath: string,
  itemImage: string
) => {
  try {
    let fileName;

    const getImageHash = () =>
      new Promise((resolve, reject) => {
        imageHash(
          `./${imageJustUploadedPath}`,
          16,
          true,
          (error: any, data: any) => {
            if (error) {
              reject(JSON.stringify(error));
            } else {
              resolve(data);
            }
          }
        );
      });

    const hash = (await getImageHash()) as string;

    const imageAlreadyExistsInDb = await ImageHash.findOne({
      hashValue: hash,
    });

    if (imageAlreadyExistsInDb) {
      const tryingToReUploadADuplicate = await reuploadDuplicateCheck(
        imageJustUploadedPath,
        itemImage
      );

      if (!tryingToReUploadADuplicate) {
        // dont increment if the same user/org is using the same image multiple times for the same use case
        await ImageHash.findOneAndUpdate(
          {
            // Increase the number of places this image is used
            hashValue: hash,
          },
          {
            $inc: {
              numberOfUses: 1,
            },
          },
          {
            new: true,
          }
        );

        /*
        console.log(
          "num of uses of hash (old image): " + imageHashObj._doc.numberOfUses
        );
        */
      }

      /*
      console.log("Image already exists in db");
      remove the image that was just uploaded
      */
      deleteDuplicatedImage(imageJustUploadedPath);

      // @ts-ignore
      fileName = imageAlreadyExistsInDb._doc.fileName; // will include have file already in db if pic is already saved will be null otherwise
    } else {
      let hashObj = new ImageHash({
        hashValue: hash,
        fileName: imageJustUploadedPath,
        numberOfUses: 1,
      });

      await hashObj.save();

      /*
      console.log(
        'number of uses of hash (new image) : ' + hashObj._doc.numberOfUses
      );
      */
    }
    return fileName;
  } catch (error) {
    throw new ValidationError(
      [
        {
          message: requestContext.translate('invalid.fileType'),
          code: 'invalid.fileType',
          param: 'fileType',
        },
      ],
      requestContext.translate('invalid.fileType')
    );
  }
};
