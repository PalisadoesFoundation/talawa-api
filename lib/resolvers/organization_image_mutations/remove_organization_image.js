const Organization = require('../../models/Organization');
const User = require('../../models/User');
const adminCheck = require('../functions/adminCheck');
const deleteImage = require('../../helper_functions/deleteImage');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_ORGANIZATION_PROFILE_CODE,
  NOT_FOUND_ORGANIZATION_PROFILE_MESSAGE,
  NOT_FOUND_ORGANIZATION_PROFILE_PARAM,
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

  if (!org.image) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_ORGANIZATION_PROFILE_MESSAGE),
      NOT_FOUND_ORGANIZATION_PROFILE_CODE,
      NOT_FOUND_ORGANIZATION_PROFILE_PARAM
    );
  }

  await deleteImage(org.image);

  const newOrganization = await Organization.findOneAndUpdate(
    {
      _id: org.id,
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
  return newOrganization;
};
