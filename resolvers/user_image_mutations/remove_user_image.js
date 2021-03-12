
const authCheck = require("../functions/authCheck");
const { unlink } = require("fs");
const User = require("../../models/User");
const Organization = require("../../models/Organization")
const deleteImage = require("../../helper_functions/deleteImage")
const ImageHash = require("../../models/ImageHash")

module.exports = async (parent, args, context, info) => {
    authCheck(context);
    try{
    const user = await User.findById(context.userId);
    if (!user) throw new Error("User not found")

    if(!user.image) throw new Error("User does not have a profile image")

    await deleteImage(user.image);


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
}catch(e){
    throw e;
}

}