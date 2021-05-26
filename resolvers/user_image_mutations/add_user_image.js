const User = require('../../models/User');
const authCheck = require('../functions/authCheck');
const uploadImageHelper = require('../../helper_functions/uploadImage');
const { NotFound } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const addUserImage = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findById(context.userId);
  if (!user) {
    throw new NotFound([
      {
        message: requestContext.translate('user.notFound'),
        code: 'user.notFound',
        param: 'user',
      },
    ]);
  }

  const uploadImage = await uploadImageHelper(args.file, user.image);

  return await User.findOneAndUpdate(
    { _id: user.id },
    {
      $set: {
        image: uploadImage.imageAlreadyInDbPath
          ? uploadImage.imageAlreadyInDbPath
          : uploadImage.newImagePath,
      },
    },
    {
      new: true,
    }
  );
};

module.exports = addUserImage;
