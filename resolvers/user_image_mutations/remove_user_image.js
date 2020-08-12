
const authCheck = require("../functions/authCheck");
const { unlink } = require("fs");
const User = require("../../models/User");



module.exports = async (parent, args, context, info) => {
    authCheck(context);

    const user = await User.findById(context.userId);
    if (!user) throw new Error("User not found")

    if(!user.image) throw new Error("User does not have a profile image")

    unlink(user.image, function (err) {
        if (err) throw err;
        // if no error, file has been deleted successfully
        console.log("File deleted!");
    });

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