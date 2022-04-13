const User = require('../../models/User');
const deleteImage = require('../../helper_functions/deleteImage');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_PROFILE_MESSAGE,
  NOT_FOUND_USER_PROFILE_CODE,
  NOT_FOUND_USER_PROFILE_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  const user = await User.findById(context.userId);
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  if (!user.image) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_PROFILE_MESSAGE),
      NOT_FOUND_USER_PROFILE_CODE,
      NOT_FOUND_USER_PROFILE_PARAM
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
