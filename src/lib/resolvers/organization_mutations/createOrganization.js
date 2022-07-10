const { User, Organization } = require('../../models');
const { userExists } = require('../../utilities/userExists');
const { uploadImage } = require('../../utilities');

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
  await newOrganization.save();

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
