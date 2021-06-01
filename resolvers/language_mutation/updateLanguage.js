const User = require('../../models/User');

const updateLanguage = async (parent, args, context) => {
  // authentication check
  if (!context.isAuth) throw new Error('User is not authenticated');

  // gets user in token - to be used later on
  const userFound = await User.findOne({
    _id: context.userId,
  });
  if (!userFound) {
    throw new Error('User does not exist');
  }

  //UPDATE LANGUAGE
  userFound.overwrite({
    ...userFound._doc,
    appLanguageCode: args.languageCode,
  });

  await userFound.save();

  return userFound;
};

module.exports = updateLanguage;
