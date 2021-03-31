const User = require('../../models/User');
const Organization = require('../../models/Organization');
const authCheck = require('../functions/authCheck');
const creatorCheck = require('../functions/creatorCheck');

const removeOrganizaiton = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) throw new Error('User does not exist');

  // checks to see if organization exists
  const org = await Organization.findOne({ _id: args.id });
  if (!org) throw new Error('Organization not found');

  // check if the user is the creator
  creatorCheck(context, org);

  // remove organization from the user's created organization field
  user.overwrite({
    ...user._doc,
    createdOrganizations: user._doc.createdOrganizations.filter(
      (organization) => organization.id !== org.id
    ),
  });
  user.save();

  // Remove organization from all member's joined organizations field
  const users = await User.find();
  users.forEach(async (user) => {
    if (user._doc.joinedOrganizations.includes(org.id)) {
      user.overwrite({
        ...user._doc,
        joinedOrganizations: user._doc.joinedOrganizations.filter(
          (organization) => organization.id !== org.id
        ),
      });
    }
  });

  // Remove organization from all member's adminFor field
  users.forEach(async (user) => {
    if (user._doc.adminFor.includes(org.id)) {
      user.overwrite({
        ...user._doc,
        adminFor: user._doc.adminFor.filter(
          (organization) => organization.id !== org.id
        ),
      });
      await user.save();
    }
  });

  // delete organzation
  await Organization.deleteOne({ _id: args.id });

  return {
    ...user._doc,
    password: null,
  };
};

module.exports = removeOrganizaiton;
