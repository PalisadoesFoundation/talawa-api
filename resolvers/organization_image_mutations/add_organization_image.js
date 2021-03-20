const Organization = require('../../models/Organization');
const User = require('../../models/User');

const authCheck = require('../functions/authCheck');
const adminCheck = require('../functions/adminCheck');
const uploadImage = require('../../helper_functions/uploadImage');

module.exports = async (parent, args, context, info) => {
  authCheck(context);

  try {
    const user = await User.findById(context.userId);
    if (!user) throw new Error('User not found');

    const org = await Organization.findById(args.organizationId);
    if (!org) throw new Error('Organization not found');

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
  } catch (e) {
    throw e;
  }
};
