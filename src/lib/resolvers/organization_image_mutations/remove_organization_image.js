const { User, Organization } = require('../../models');
const adminCheck = require('../functions/adminCheck');
const { deleteImage } = require('../../helper_functions');
const { NotFoundError } = require('../../helper_lib/errors');
const requestContext = require('../../helper_lib/request-context');

module.exports = async (parent, args, context) => {
  const user = await User.findById(context.userId);
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const org = await Organization.findById(args.organizationId);
  if (!org) {
    throw new NotFoundError(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }

  adminCheck(context, org); // Ensures user is an administrator of the organization

  if (!org.image) {
    throw new NotFoundError(
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
