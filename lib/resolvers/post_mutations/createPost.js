const User = require('../../models/User');
const Post = require('../../models/Post');
const Organization = require('../../models/Organization');

const uploadImage = require('../../helper_functions/uploadImage');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_ORGANIZATION_CODE,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  // gets user in token - to be used later on
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const organization = await Organization.findOne({
    _id: args.data.organizationId,
  });
  if (!organization) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_ORGANIZATION_MESSAGE),
      NOT_FOUND_ORGANIZATION_CODE,
      NOT_FOUND_ORGANIZATION_PARAM
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
