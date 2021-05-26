const User = require('../../models/User');
const Post = require('../../models/Post');

const authCheck = require('../functions/authCheck');

const uploadImage = require('../../helper_functions/uploadImage');
const { NotFound } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

module.exports = async (parent, args, context) => {
  // ensure user is authenticated
  authCheck(context);
  // gets user in token - to be used later on
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFound([
      {
        message: requestContext.translate('user.notFound'),
        code: 'user.notFound',
        param: 'user',
      },
    ]);
  }
  let uploadImageObj;
  if (args.file) {
    uploadImageObj = await uploadImage(args.file, '');
  }
  // creates new Post
  let newPost = new Post({
    ...args.data,
    creator: context.userId,
    organization: args.data.organizationId,
    imageUrl: args.file ? uploadImageObj.newImagePath : '',
  });

  newPost = await newPost.save();

  // add creator

  return {
    ...newPost._doc,
  };
};
