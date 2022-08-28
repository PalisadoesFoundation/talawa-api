// const User = require('../../models/User');
// const Post = require('../../models/Post');
// const Organization = require('../../models/Organization');

const addTenantId = require('../../helper_functions/addTenantId');
const uploadImage = require('../../helper_functions/uploadImage');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const mainDb = require('../../models/');

module.exports = async (parent, args, context) => {
  if (!context.db) context.db = mainDb;
  const { User, Post, Organization } = context.db;
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
  const tmp = addTenantId(newPost._id, context.tenantId);
  console.log('tmp', tmp);

  return {
    ...newPost._doc,
    _id: addTenantId(newPost._id, context.tenantId),
  };
};
