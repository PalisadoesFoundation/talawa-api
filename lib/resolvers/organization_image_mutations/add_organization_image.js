const Organization = require('../../models/Organization');
const User = require('../../models/User');
const adminCheck = require('../functions/adminCheck');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const uploadImage = require('../../helper_functions/uploadImage');

const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_PARAM,
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

  const org = await Organization.findById(args.organizationId);
  if (!org) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_ORGANIZATION_MESSAGE),
      NOT_FOUND_ORGANIZATION_CODE,
      NOT_FOUND_ORGANIZATION_PARAM
    );
  }

  adminCheck(context, org); // Ensures user is an administrator of the organization

  // Upload Image
  let uploadImageObj = await uploadImage(args.file, org.image);

  const newOrganization = await Organization.findOneAndUpdate(
    { _id: org.id },
    {
      $set: {
        image: uploadImageObj.imageAlreadyInDbPath
          ? uploadImageObj.imageAlreadyInDbPath
          : uploadImageObj.newImagePath,
      },
    },
    {
      new: true,
    }
  );

  return newOrganization;
};
