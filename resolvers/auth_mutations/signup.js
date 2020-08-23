
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const { createAccessToken, createRefreshToken } = require("../../helper_functions/auth");
const shortid = require("shortid");
const { createWriteStream, unlink } = require("fs");
const path = require("path")


module.exports = async (parent, args, context, info) => {
  try {
    const emailTaken = await User.findOne({ email: args.data.email });
    if (emailTaken) {
      throw new Error("Email address taken.");
    }

    const hashedPassword = await bcrypt.hash(args.data.password, 12);

    let userImage;
    if (args.file) {

      const id = shortid.generate();

      const { createReadStream, filename } = await args.file;

      const upload = await new Promise((res) =>
        createReadStream().pipe(
          createWriteStream(
            path.join(__dirname, "../../images", `/${id}-${filename}`)
          )
        )
          .on("close", res)
      );

      userImage = `images/${id}-${filename}`
    }

    let user = new User({
      ...args.data,
      image: userImage,
      password: hashedPassword
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