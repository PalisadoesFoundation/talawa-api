const { User, Post, Organization } = require('../../models');
const { uploadImage } = require('../../helper_functions');
const { NotFoundError } = require('../../helper_lib/errors');
const requestContext = require('../../helper_lib/request-context');

module.exports = async (parent, args, context) => {
  // gets user in token - to be used later on
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const organization = await Organization.findOne({
    _id: args.data.organizationId,
  });
  if (!organization) {
    throw new NotFoundError(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
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
