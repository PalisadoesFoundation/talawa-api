const User = require("../../models/User");
const authCheck = require("../functions/authCheck");
const uploadImage = require("../../helper_functions/uploadImage");
const Apperror = require('../../error_middleware/error_handler');


const addUserImage = async (parent, args, context, info) => {
    authCheck(context);

    try {
        const user = await User.findById(context.userId);
        if (!user) throw new Apperror("User not found" ,404)


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
        throw Apperror("server error" + e, 500);
    }
};

module.exports = addUserImage;
