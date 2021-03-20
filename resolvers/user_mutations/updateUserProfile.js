const authCheck = require("../functions/authCheck");
const userExists = require("../../helper_functions/userExists");
const User = require("../../models/User");

const updateUserProfile = async (parent, args, context, info) => {

    //authentication check
    authCheck(context);

    try {
        //gets user in token - to be used later on
        let userFound = await userExists(context.userId);
        if (!userFound) throw new Error("User not found");

        if(args.data.email != null){
            const emailTaken = await User.findOne({
                email: args.data.email.toLowerCase(),
            });

            if (emailTaken) {
                throw new Error("Email address taken.");
            }
        }

        //UPDATE USER
        userFound.overwrite({
        ...userFound._doc,
        ...args.data
        })
        
        await userFound.save();
  
        return userFound;
    } catch (error) {
        throw error;
    }
}

module.exports = updateUserProfile;