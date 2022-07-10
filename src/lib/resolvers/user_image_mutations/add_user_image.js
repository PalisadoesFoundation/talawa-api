const { User } = require('../../models');
const { uploadImage } = require('../../utilities');
const { NotFoundError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');

const addUserImage = async (parent, args, context) => {
  const user = await User.findById(context.userId);
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const imageToUpload = await uploadImage(args.file, user.image);

  return await User.findOneAndUpdate(
    { _id: user.id },
    {
      $set: {
        image: imageToUpload.imageAlreadyInDbPath
          ? imageToUpload.imageAlreadyInDbPath
          : imageToUpload.newImagePath,
      },
    },
    {
      new: true,
    }
  );
};

module.exports = addUserImage;
