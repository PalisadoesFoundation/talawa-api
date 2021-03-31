const { unlink } = require('fs');
const ImageHash = require('../models/ImageHash');

const reuploadDuplicateCheck = require('./ReuploadDuplicateCheck');

async function deleteImage(imageToBeDeleted, imageBelongingToItem) {
  let tryingToReUploadADuplicate;
  if (imageBelongingToItem) {
    tryingToReUploadADuplicate = await reuploadDuplicateCheck(
      imageBelongingToItem,
      imageToBeDeleted
    );
  }

  if (!tryingToReUploadADuplicate) {
    //console.log("Image isnt duplicate")
    // Only remove the old image if its different from the new one
    // Ensure image hash isn't used by multiple users/organization before deleting it
    let hash = await ImageHash.findOne({
      fileName: imageToBeDeleted,
    });

    if (hash && hash.numberOfUses > 1) {
      // image is only deleted if it is only used once
      console.log('Image cannot be deleted');
    } else {
      console.log('Image is only used once and therefore can be deleted');
      unlink(imageToBeDeleted, function (err) {
        if (err) throw err;
        // if no error, file has been deleted successfully
        console.log('File deleted!');
      });
    }

    await ImageHash.findOneAndUpdate(
      {
        // decrement number of uses of hashed image
        fileName: imageToBeDeleted,
      },
      {
        $inc: {
          numberOfUses: -1,
        },
      },
      {
        new: true,
      }
    );
  }
}

module.exports = deleteImage;
