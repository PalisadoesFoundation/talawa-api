const shortid = require('shortid');
const { createWriteStream, unlinkSync } = require('fs');
const path = require('path');
const imageAlreadyInDbCheck = require('./imageAlreadyInDbCheck');
const deleteImage = require('./deleteImage');
const imageExtensionCheck = require('./imageExtensionCheck');

module.exports = async (file, itemImage) => {
  const id = shortid.generate();
  const { createReadStream, filename } = await file;

  const save_path = path.join(__dirname, '../images', `/${id}-${filename}`);

  // throw an error if file is not png or jpg
  await imageExtensionCheck(imageJustUploadedPath);
  // upload new image
  await new Promise((resolve, reject) =>
    createReadStream()
      .on('error', (error) => {
        if (createReadStream().truncated)
          // delete the truncated file
          unlinkSync(path);
        reject(error);
      })
      .pipe(createWriteStream(save_path))
      .on('error', (error) => reject(error))
      .on('finish', () => resolve({ path }))
  );
  let imageJustUploadedPath = `images/${id}-${filename}`;

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
