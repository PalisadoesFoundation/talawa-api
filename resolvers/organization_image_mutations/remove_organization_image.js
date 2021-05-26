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
    throw new NotFound([
      {
        message: requestContext.translate('user.notFound'),
        code: 'user.notFound',
        param: 'user',
      },
    ]);
  }

  const org = await Organization.findById(args.organizationId);
  if (!org) {
    throw new NotFound([
      {
        message: requestContext.translate('organization.notFound'),
        code: 'organization.notFound',
        param: 'organization',
      },
    ]);
  }

  adminCheck(context, org); // Ensures user is an administrator of the organization

  if (!org.image) {
    throw new NotFound([
      {
        message: requestContext.translate('organization.profile.notFound'),
        code: 'organization.notFound',
        param: 'organization',
      },
    ]);
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
