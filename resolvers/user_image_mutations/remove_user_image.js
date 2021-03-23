const authCheck = require("../functions/authCheck");
const User = require("../../models/User");
const deleteImage = require("../../helper_functions/deleteImage")
const Apperror = require('../../error_middleware/error_handler');
module.exports = async (parent, args, context, info) => {
    authCheck(context);
    try {
        const user = await User.findById(context.userId);
        if (!user) throw Apperror("User not found", 404);

        if (!user.image) throw new Apperror("User does not have a profile image", 404)

        await deleteImage(user.image);


        const newUser = await User.findOneAndUpdate({
            _id: user.id
        }, {
            $set: {
                image: null
            }
        }, {
            new: true
        })
        return newUser;
    } catch (e) {
        throw Apperror("server error" + e, 404);
    }

}