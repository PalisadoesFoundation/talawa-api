import { imageHash } from 'image-hash';
import { ValidationError } from '../libraries/errors';
import requestContext from '../libraries/request-context';

interface UrlRequestObject {
  encoding?: string | null;
  url: string | null;
}

interface BufferObject {
  ext?: string;
  data: Buffer;
  name?: string;
}

export type Type_OldSrc = string | UrlRequestObject | BufferObject;

const getImageHash = (oldSrc: Type_OldSrc) => {
  return new Promise((resolve, reject) => {
    imageHash(oldSrc, 16, true, (error: Error, data: any) => {
      if (error) {
        reject(error);
      }

      resolve(data);
    });
  });
};

export const reuploadDuplicateCheck = async (
  imageJustUploadedPath: Type_OldSrc,
  itemImage: Type_OldSrc
) => {
  /*
  This function checks whether a user is trying to re-upload the same profile picture
  or an org is trying to re-upload the same org image 
  */
  try {
    if (itemImage) {
      let oldImageHash = await getImageHash(itemImage);

      let newImageHash = await getImageHash(imageJustUploadedPath);

      return oldImageHash === newImageHash;
    }

    return false;
  } catch (error) {
    console.error(error);

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
