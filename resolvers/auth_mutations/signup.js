
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const {createAccessToken, createRefreshToken} = require("../../helper_functions/auth");



module.exports = async (parent, args, context, info) => {
    try {
      const emailTaken = await User.findOne({ email: args.data.email });
      if (emailTaken) {
        throw new Error("Email address taken.");
      }
  
      const hashedPassword = await bcrypt.hash(args.data.password, 12);
  
      let user = new User({
        ...args.data,
        tokenVersion: 0,
        password: hashedPassword,
      });
  
      user = await user.save();
  
      const accessToken = await createAccessToken(user);
      const refreshToken = await createRefreshToken(user);
  
  
      return {
        user: user._doc,
        accessToken,
        refreshToken
      };
    } catch (e) {
      throw e;
    }
  };