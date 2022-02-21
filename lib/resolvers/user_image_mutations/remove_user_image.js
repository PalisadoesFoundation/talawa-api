const User = require('../../models/User');
const deleteImage = require('../../helper_functions/deleteImage');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  const user = await User.findById(context.userId);
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  if (!user.image) {
    throw new NotFoundError(
      requestContext.translate('user.profileImage.notFound'),
      'user.profileImage.notFound',
      'userProfileImage'
    );
  }

  await deleteImage(user.image);

  const newUser = await User.findOneAndUpdate(
    {
      _id: user.id,
    },
    {
      $set: {
        image: null,
      },
    },
    {
      new: true,
    }
  );
  return newUser;
};
