
const deleteImage = require("./deleteImage");

module.exports = async (filename) => {
    let extension = filename.split(".").pop();
    if (extension != "png" && extension != "jpg" && extension != "jpeg") {
      await deleteImage(filename);
      throw Apperror("Invalid file Type. Only .jpg and .png files are accepted");
    }
}