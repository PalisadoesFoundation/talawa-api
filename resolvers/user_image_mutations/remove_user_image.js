const authCheck = require('../functions/authCheck');
const User = require('../../models/User');
const deleteImage = require('../../helper_functions/deleteImage');

module.exports = async (parent, args, context) => {
  authCheck(context);

  const user = await User.findById(context.userId);
  if (!user) throw new Error('User not found');

  if (!user.image) throw new Error('User does not have a profile image');

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
