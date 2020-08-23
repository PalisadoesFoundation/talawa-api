
const { imageHash } = require("image-hash");

module.exports = async (imageJustUploadedPath, itemImage) => {
  // This function checks whether a user is trying to re=upload the same profile picture or an org is trying to re-upload the same org image
  if (itemImage) {
    let oldImageHash;
    let newImageHash;
    await new Promise((resolve, reject) => {
      imageHash(itemImage, 16, true, (error, data) => {
        if (error) oldImageHash=""
        oldImageHash = data;
        resolve();
      });
    }).then(() => {
      return oldImageHash;
    }).catch((e)=>{
      throw new Error("Invalid file type")
    });

    await new Promise((resolve, reject) => {
      imageHash(imageJustUploadedPath, 16, true, (error, data) => {
        if (error) newImageHash=""
        newImageHash = data;
        resolve();
      });
    }).then(() => {
      return newImageHash;
    }).catch((e)=>{
      throw new Error("Invalid file type")
    });
    console.log("old image hash: " + oldImageHash);
    console.log("new image hash: " + newImageHash);
    return oldImageHash == newImageHash;
  }
  return false;
};
