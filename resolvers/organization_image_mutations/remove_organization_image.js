const Organization = require('../../models/Organization');
const User = require('../../models/User');
const deleteImage = require('../../helper_functions/deleteImage');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  const { org } = context;
  const user = await User.findById(context.userId);
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

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
