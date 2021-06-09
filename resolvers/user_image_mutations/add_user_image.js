const User = require('../../models/User');
const uploadImageHelper = require('../../helper_functions/uploadImage');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const addUserImage = async (parent, args, context) => {
  const user = await User.findById(context.userId);
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
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
