
const ImageHash = require("../models/ImageHash")
const { imageHash } = require('image-hash');
const deleteImage = require("./deleteImage");
const User = require("../models/User");



// Check to see if image already exists in db using hash
// if its there point to that image and remove the image just uploaded
// if its not there allow the file to remain uploaded
module.exports = function imageAlreadyInDbCheck(userImage, userImageAlreadyInDb, user) {
    let newUser
    imageHash(`./${userImage}`, 16, true, async (error, data) => {
        if (error)
            throw error;
        hash = data;

        // Finds an entry with the same hash
        const imageAlreadyExistsInDb = await ImageHash.findOne({
            hashValue: hash
        });

        if (imageAlreadyExistsInDb) {
            console.log("Image already exists in db");

            // remove the image that was just uploaded
            deleteImage(userImage);

            // set user image to the image that already exists
            userImageAlreadyInDb = imageAlreadyExistsInDb._doc.fileName;
        }
        else {
            if (user.image) { // If user already has a profile picture delete it from the API
                deleteImage(user.image);
            }

            const hashObj = new ImageHash({
                hashValue: hash,
                fileName: userImage
            });
            await hashObj.save();
        }

        console.log("image to be set: " + userImageAlreadyInDb);
        newUser = await User.findOneAndUpdate(
            { _id: user.id },
            {
                $set: {
                    image: userImageAlreadyInDb ? userImageAlreadyInDb : userImage
                }
            },
            {
                new: true
            }
        );
    });
}

