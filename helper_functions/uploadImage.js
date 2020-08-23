const shortid = require("shortid");
const { createWriteStream } = require("fs");
const path = require("path");
const imageAlreadyInDbCheck = require("./imageAlreadyInDbCheck");
const deleteImage = require("./deleteImage");
const { imageHash } = require("image-hash");

module.exports = async (file, itemImage) => {
  const id = shortid.generate();
  const { createReadStream, filename } = await file;

  // upload new image
  await new Promise((res) =>
    createReadStream()
      .pipe(
        createWriteStream(
          path.join(__dirname, "../images", `/${id}-${filename}`)
        )
      )
      .on("close", res)
  );
  let imageJustUploadedPath = `images/${id}-${filename}`;

  // throw an error if file is not png or jpg
  let extension = filename.split(".").pop();
  if (extension != "png" && extension != "jpg") {
    await deleteImage(imageJustUploadedPath);
    throw new Error("Invalid file Type. Only .jpg and .png files are accepted");
  }

  //return imagePath;

  if (itemImage) {
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
