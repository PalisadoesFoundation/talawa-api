const { unlink } = require('fs');
const chalk = require('chalk');

module.exports = function deleteDuplicatedImage(imagePath) {
  unlink(imagePath, function (err) {
    if (err) throw err;
    // if no error, file has been deleted successfully
    console.log(
      chalk.bgBlueBright('File was deleted as it already exists in the db!')
    );
  });
};
