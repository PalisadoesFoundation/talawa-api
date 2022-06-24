import { createWriteStream } from 'fs';
import path from 'path';
import shortid from 'shortid';
import logger from '../helper_lib/logger';
import { imageAlreadyInDbCheck } from './imageAlreadyInDbCheck';
import { deleteImage } from './deleteImage';
import { imageExtensionCheck } from './imageExtensionCheck';

export const uploadImage = async (file: any, itemImage: any) => {
  const id = shortid.generate();

  const { createReadStream, filename } = await file;

  // throw an error if file is not png or jpg
  await imageExtensionCheck(filename);

  // upload new image
  await new Promise((resolve, reject) =>
    createReadStream()
      .pipe(
        createWriteStream(
          path.join(__dirname, '../images', `/${id}-${filename}`)
        )
      )
      .on('close', resolve)
      .on('error', (error: any) => reject(error))
      .on('finish', () => resolve({ path }))
  );

  let imageJustUploadedPath = `images/${id}-${filename}`;

  //return imagePath;

  if (itemImage) {
    logger.info('old image should be deleted');
    // If user/org already has an image delete it from the API
    await deleteImage(itemImage, imageJustUploadedPath);
  }

  let imageAlreadyInDbPath = await imageAlreadyInDbCheck(
    imageJustUploadedPath,
    itemImage
  );

  return {
    newImagePath: imageJustUploadedPath,
    imageAlreadyInDbPath: imageAlreadyInDbPath,
  };
};
