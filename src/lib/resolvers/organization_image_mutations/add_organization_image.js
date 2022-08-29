const { User, Organization } = require('../../models');
const { adminCheck } = require('../../utilities');
const { NotFoundError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');
const { uploadImage } = require('../../utilities');

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
