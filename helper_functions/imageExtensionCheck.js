
const deleteImage = require("./deleteImage");

module.exports = async (filename) => {
    let extension = filename.split(".").pop();
    if (extension != "png" && extension != "jpg") {
      await deleteImage(filename);
      throw new Error("Invalid file Type. Only .jpg and .png files are accepted");
    }
}