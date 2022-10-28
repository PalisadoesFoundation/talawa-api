const { unlink } = require('fs');
const logger = require('logger');
/**
 * This function deletes a duplicated image using the function fs.unlink().
 * @param {string} imagePath - Path of the image
 */
module.exports = function deleteDuplicatedImage(imagePath) {
  unlink(imagePath, function (err) {
    if (err) throw err;
    // if no error, file has been deleted successfully
    logger.info('File was deleted as it already exists in the db!');
  });
};
