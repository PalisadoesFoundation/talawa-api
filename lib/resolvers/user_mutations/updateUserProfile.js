/* eslint-disable no-useless-catch */
const userExists = require('../../helper_functions/userExists');
const User = require('../../models/User');
const uploadImage = require('../../helper_functions/uploadImage');
const { ConflictError, NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const updateUserProfile = async (parent, args, context) => {
  try {
    //gets user in token - to be used later on
    let userFound = await userExists(context.userId);
    if (!userFound) {
      throw new NotFoundError(
        requestContext.translate('user.notFound'),
        'user.notFound',
        'user'
      );
    }
    if (args.data.email !== undefined) {
      const emailTaken = await User.findOne({
        email: args.data.email.toLowerCase(),
      });

      if (emailTaken) {
        throw new ConflictError(
          requestContext.translate('email.alreadyExists'),
          'email.alreadyExists',
          'email'
        );
      }
    }

    // Upload file
    let uploadImageObj;
    if (args.file) {
      uploadImageObj = await uploadImage(args.file, null);
    }

    if (uploadImageObj) {
      //UPDATE USER
      userFound.overwrite({
        ...userFound._doc,
        ...args.data,
        image: uploadImageObj.imageAlreadyInDbPath
          ? uploadImageObj.imageAlreadyInDbPath
          : uploadImageObj.newImagePath,
      });
    } else {
      //UPDATE USER
      userFound.overwrite({
        ...userFound._doc,
        ...args.data,
      });
    }

    await userFound.save();
    return userFound;
  } catch (error) {
    throw error;
  }
};

module.exports = updateUserProfile;
