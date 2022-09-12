import { createWriteStream } from 'fs';
import path from 'path';
import shortid from 'shortid';
import logger from '../libraries/logger';
import { imageAlreadyInDbCheck } from './imageAlreadyInDbCheck';
import { deleteImage } from './deleteImage';
import { imageExtensionCheck } from './imageExtensionCheck';

export const uploadImage = async (
  newImageFile: any,
  oldImagePath: string | null
) => {
  const id = shortid.generate();

  const { createReadStream, filename } = await newImageFile;

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
      .on('finish', () =>
        resolve({
          path,
        })
      )
  );

  let newImagePath = `images/${id}-${filename}`;

  if (oldImagePath) {
    logger.info('old image should be deleted');

    // If user/organization already has an image delete it from the API
    await deleteImage(oldImagePath, newImagePath);
  }

  let imageAlreadyInDbPath = await imageAlreadyInDbCheck(
    oldImagePath,
    newImagePath
  );

  return {
    newImagePath,
    imageAlreadyInDbPath,
  };
};
