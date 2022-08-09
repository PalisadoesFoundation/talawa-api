const { USER_NOT_FOUND, POST_NOT_FOUND } = require('../../../constants');
const uploadImage = require('../../helper_functions/uploadImage');
const userExists = require('../../helper_functions/userExists');
const Post = require('../../models/Post');

module.exports = async (parent, args, context) => {
  const userFound = await userExists(context.userId);
  if (!userFound) throw new Error(USER_NOT_FOUND);

  const postFound = await Post.findOne({
    _id: args.data._id,
  });

  if (!postFound) {
    throw new Error(POST_NOT_FOUND);
  }

  let uploadImageObj;
  if (args.file) {
    uploadImageObj = await uploadImage(args.file, '');
  }

  const updatedPost = await Post.findByIdAndUpdate(
    { _id: args.data._id },
    {
      ...args.data,
      imageUrl: args.file ? uploadImageObj.newImagePath : '',
    }
  );

  return {
    ...updatedPost._doc,
  };
};
