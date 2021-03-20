const Organization = require('../../models/Organization');

const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const {
  createAccessToken,
  createRefreshToken,
} = require('../../helper_functions/auth');

const uploadImage = require('../../helper_functions/uploadImage');

module.exports = async (parent, args, context, info) => {
  try {
    const emailTaken = await User.findOne({
      email: args.data.email.toLowerCase(),
    });
    if (emailTaken) {
      throw new Error('Email address taken.');
    }

    // TODO: this check is to be removed
    let org;
    if (args.data.organizationUserBelongsToId) {
      org = await Organization.findOne({
        _id: args.data.organizationUserBelongsToId,
      });
      if (!org) throw new Error('Organization not found');
    }

    const hashedPassword = await bcrypt.hash(args.data.password, 12);

    // Upload file
    let uploadImageObj;
    if (args.file) {
      uploadImageObj = await uploadImage(args.file, null);
    }

    let user = new User({
      ...args.data,
      organizationUserBelongsTo: org ? org : null,
      email: args.data.email.toLowerCase(), // ensure all emails are stored as lowercase to prevent duplicated due to comparison errors
      image: uploadImageObj
        ? uploadImageObj.imageAlreadyInDbPath
          ? uploadImageObj.imageAlreadyInDbPath
          : uploadImageObj.newImagePath
        : null,
      password: hashedPassword,
    });

    user = await user.save();
    const accessToken = await createAccessToken(user);
    const refreshToken = await createRefreshToken(user);

    return {
      user: {
        ...user._doc,
        password: null,
      },
      accessToken,
      refreshToken,
    };
  } catch (e) {
    throw e;
  }
};
