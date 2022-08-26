const User = require('../../models/User');
const Organization = require('../../models/Organization');
const userExists = require('../../helper_functions/userExists');
const newDbUrl = require('../../helper_functions/newDbUrl');
const Tenant = require('../../models/Tenant');
const { addTenantConnection } = require('../../ConnectionManager');

const uploadImage = require('../../helper_functions/uploadImage');

const createOrganization = async (parent, args, context) => {
  //gets user in token - to be used later on
  let userFound = await userExists(context.userId);

  //Upload file
  let uploadImageObj;
  if (args.file) {
    uploadImageObj = await uploadImage(args.file, null);
  }

  let newOrganization = new Organization({
    ...args.data,
    image: uploadImageObj
      ? uploadImageObj.imageAlreadyInDbPath
        ? uploadImageObj.imageAlreadyInDbPath
        : uploadImageObj.newImagePath
      : null,
    creator: userFound,
    admins: [userFound],
    members: [userFound],
  });

  const savedOrg = await newOrganization.save();
  const url = newDbUrl(savedOrg._id.toString());
  const tenant = new Tenant({
    organization: savedOrg._id,
    url,
  });
  await tenant.save();
  await addTenantConnection(savedOrg._id);

  await User.findOneAndUpdate(
    { _id: userFound.id },
    {
      $set: {
        joinedOrganizations: [
          ...userFound._doc.joinedOrganizations,
          newOrganization,
        ],
        createdOrganizations: [
          ...userFound._doc.createdOrganizations,
          newOrganization,
        ],
        adminFor: [...userFound._doc.adminFor, newOrganization],
      },
    }
  );

  return newOrganization.toObject();
};

module.exports = createOrganization;
