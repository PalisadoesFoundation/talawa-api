
const { createWriteStream, unlink } = require("fs");

function deleteImage(imagePath) {
    unlink(imagePath, function (err) {
        if (err)
            throw err;
        // if no error, file has been deleted successfully
        console.log("File deleted!");
    });
}

module.exports = deleteImage