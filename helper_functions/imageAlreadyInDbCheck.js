const ImageHash = require('../models/ImageHash');
const { imageHash } = require('image-hash');
const deleteDuplicatedImage = require('./deleteDuplicatedImage');
const reuploadDuplicateCheck = require('./ReuploadDuplicateCheck');
const { ValidationError } = require('errors');
const requestContext = require('talawa-request-context');

// Check to see if image already exists in db using hash
// if its there point to that image and remove the image just uploaded
// if its not there allow the file to remain uploaded
module.exports = function imageAlreadyInDbCheck(
  imageJustUploadedPath,
  itemImage
) {
  let fileName;
  return new Promise((resolve) => {
    imageHash(`./${imageJustUploadedPath}`, 16, true, async (error, data) => {
      const hash = data;

      // Finds an entry with the same hash
      const imageAlreadyExistsInDb = await ImageHash.findOne({
        hashValue: hash,
      });

      if (imageAlreadyExistsInDb) {
        let tryingToReUploadADuplicate;
        tryingToReUploadADuplicate = await reuploadDuplicateCheck(
          imageJustUploadedPath,
          itemImage
        );
        if (!tryingToReUploadADuplicate) {
          // dont increment if the same user/org is using the same image multiple times for the same use case
          await ImageHash.findOneAndUpdate(
            {
              // Increase the number of places this image is used
              hashValue: hash,
            },
            {
              $inc: {
                numberOfUses: 1,
              },
            },
            {
              new: true,
            }
          );
        }
        // remove the image that was just uploaded
        deleteDuplicatedImage(imageJustUploadedPath);

        fileName = imageAlreadyExistsInDb._doc.fileName; // will include have file already in db if pic is already saved will be null otherwise
      } else {
        let hashObj = new ImageHash({
          hashValue: hash,
          fileName: imageJustUploadedPath,
          numberOfUses: 1,
        });
        await hashObj.save();
      }
      resolve();
    });
  })
    .then(() => {
      return fileName;
    })
    .catch(() => {
      throw new ValidationError(
        [
          {
            message: requestContext.translate('invalid.fileType'),
            code: 'invalid.fileType',
            param: 'fileType',
          },
        ],
        requestContext.translate('invalid.fileType')
      );
    });
};
