const { unlink } = require('fs');

module.exports = function deleteDuplicatedImage(imagePath) {
  unlink(imagePath, (err) => {
    if (err) {
      throw err;
    }
    // if no error, file has been deleted successfully
    // eslint-disable-next-line no-console
    console.log('File was deleted as it already exists in the db!');
  });
};
