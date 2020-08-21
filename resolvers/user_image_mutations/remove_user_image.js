
const authCheck = require("../functions/authCheck");
const { unlink } = require("fs");
const User = require("../../models/User");
const Organization = require("../../models/Organization")
const deleteImage = require("../../helper_functions/deleteImage")
const ImageHash = require("../../models/ImageHash")

module.exports = async (parent, args, context, info) => {
    authCheck(context);

    const user = await User.findById(context.userId);
    if (!user) throw new Error("User not found")

    if(!user.image) throw new Error("User does not have a profile image")

    
    const imageHash = await ImageHash.findOneAndUpdate({
        fileName: user.image
    })

    console.log(imageHash.numberOfUses)

    if(imageHash.numberOfUses <= 1) { // If this image is only used once delete it
        console.log("Image can be deleted")
        deleteImage(user.image);
    } else {
        console.log("Image cannot be deleted")
    }

    await ImageHash.findOneAndUpdate({ // Decrease the number of places this image is used by 1
        fileName: user.image
    }, {
        $inc: {
            'NumberOfUses': -1
        }
    })


    const newUser = await User.findOneAndUpdate({
        _id:user.id
    }, {
        $set: {
            image: null
        }
    }, {
        new:true
    })
    return newUser;

}