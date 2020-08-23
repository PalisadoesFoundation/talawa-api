const User = require("../../models/User");
const authCheck = require("../functions/authCheck");
const uploadImage = require("../../helper_functions/uploadImage");



const addUserImage = async (parent, args, context, info) => {
    authCheck(context);

    try {
        const user = await User.findById(context.userId);
        if (!user) throw new Error("User not found")


        // Upload New Image
        let uploadImageObj = await uploadImage(args.file, user.image)
        

        return await User.findOneAndUpdate(
            { _id: user.id },
            {
                $set: {
                    image: uploadImageObj.imageAlreadyInDbPath ? uploadImageObj.imageAlreadyInDbPath : uploadImageObj.newImagePath // if the image already exists use that image other wise use the image just uploaded
                }
            },
            {
                new: true
            }
        );


    } catch (e) {
        throw e;
    }
};

module.exports = addUserImage;
