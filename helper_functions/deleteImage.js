
const { createWriteStream, unlink } = require("fs");
const ImageHash = require("../models/ImageHash")

async function deleteImage(imagePath) {

    // Ensure image hash isn't used by multiple users/organization before deleting it
    let hash = await ImageHash.findOne({
        fileName: imagePath
    });

    if(hash.numberOfUses > 1) { // image is only deleted if it is only used once
        console.log("Image cannot be deleted")
    } else {
        console.log("Image is only used once and therefore can be deleted")
        unlink(imagePath, function (err) {
            if (err)
                throw err;
            // if no error, file has been deleted successfully
            console.log("File deleted!");
        });
    }

    let decrementedhash = await ImageHash.findOneAndUpdate({ // decrement number of uses of hashed image
        fileName: imagePath
    }, {
        $inc: {
            'numberOfUses': -1
        }
    }, {
        new:true
    })
    
}

module.exports = deleteImage