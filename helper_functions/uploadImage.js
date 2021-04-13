const shortid = require('shortid');
const { createWriteStream } = require('fs');
const path = require('path');
const imageAlreadyInDbCheck = require('./imageAlreadyInDbCheck');
const deleteImage = require('./deleteImage');
const imageExtensionCheck = require('./imageExtensionCheck');

module.exports = async (file, itemImage) => {
  const id = shortid.generate();
  const { createReadStream, filename } = await file;

  // upload new image
  await new Promise((res) =>
    createReadStream()
      .pipe(
        createWriteStream(
          path.join(__dirname, '../images', `/${id}-${filename}`)
        )
      )
      .on('close', res)
  );
  let imageJustUploadedPath = `images/${id}-${filename}`;
  // throw an error if file is not png or jpg
  await imageExtensionCheck(imageJustUploadedPath);

  //return imagePath;

  if (itemImage) {
    console.log('old image should be deleted: ');
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
