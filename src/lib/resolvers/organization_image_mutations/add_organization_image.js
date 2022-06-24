const { User, Organization } = require('../../models');
const adminCheck = require('../functions/adminCheck');
const { NotFoundError } = require('../../helper_lib/errors');
const requestContext = require('../../helper_lib/request-context');
const { uploadImage } = require('../../helper_functions');

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
