const authCheck = require('../functions/authCheck');
const Organization = require('../../models/Organization');
const User = require('../../models/User');
const adminCheck = require('../functions/adminCheck');
const deleteImage = require('../../helper_functions/deleteImage');
const { NotFound } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

module.exports = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findById(context.userId);
  if (!user) {
    throw new NotFound(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const org = await Organization.findById(args.organizationId);
  if (!org) {
    throw new NotFound(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }

  adminCheck(context, org); // Ensures user is an administrator of the organization

  if (!org.image) {
    throw new NotFound(
      requestContext.translate('organization.profile.notFound'),
      'organization.notFound',
      'organization'
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
