const User = require('../../models/User');
const Organization = require('../../models/Organization');
const Tenant = require('../../models/Tenant');
const userExists = require('../../helper_functions/userExists');
const newDbUrl = require('../../helper_functions/newDbUrl');
// const { IN_TEST } = require('../../../constants');
const { addTenantConnection } = require('../../ConnectionManager');

const uploadImage = require('../../helper_functions/uploadImage');
const defaultScheme = ['DirectChat', 'Posts', 'Events', 'Groups', 'GroupChats'];

const createOrganization = async (parent, args, context) => {
  //gets user in token - to be used later on
  let userFound = await userExists(context.userId);
  // customize the schema
  let schema = args.schema ? args.schema : [];
  delete args.schema;

  //Upload file
  let uploadImageObj;
  if (args.file) {
    uploadImageObj = await uploadImage(args.file, null);
  }

  let functionality = [];
  if (!args.data.customScheme) {
    functionality = defaultScheme;
  } else {
    for (let f in args.data.functionality) {
      if (args.data.functionality[f]) functionality.push(f);
    }
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
    functionality,
  });

  const savedOrg = await newOrganization.save();
  const url = newDbUrl(savedOrg._id.toString());
  const tenant = new Tenant({
    organization: savedOrg._id,
    url,
    scheme: schema,
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
  console.log('new Org: ', newOrganization.toObject());

  return newOrganization.toObject();
};

module.exports = createOrganization;
