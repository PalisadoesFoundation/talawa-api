const shortid = require('shortid');
const logger = require('logger');
const { createWriteStream } = require('fs');
const path = require('path');
const imageAlreadyInDbCheck = require('./imageAlreadyInDbCheck');
const deleteImage = require('./deleteImage');
const imageExtensionCheck = require('./imageExtensionCheck');

/**
 * This function uploads the new image and deletes the previously uploaded image if exists.
 * @param {string} file : New image file
 * @param {string} itemImage : Current Image.
 * @returns path for an uploaded image.
 */
module.exports = async (file, itemImage) => {
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
      .on('error', (error) => reject(error))
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
