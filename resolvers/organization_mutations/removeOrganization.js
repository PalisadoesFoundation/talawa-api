const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const creatorCheck = require("../functions/creatorCheck");

const removeOrganizaiton = async (parent, args, context, info) => {
  authCheck(context);
  try {
    const user = await User.findOne({ _id: context.userId });
    if (!user) throw new Error("User does not exist");

    //checks to see if organization exists
    let org = await Organization.findOne({ _id: args.id });
    if (!org) throw new Error("Organization not found");

    //check if the user is the creator
    creatorCheck(context, org);

    //remove organization from the user's created organization field
    user.overwrite({
      ...user._doc,
      createdOrganizations: user._doc.createdOrganizations.filter(organization => organization.id != org.id)
    })
    user.save();

    //delete organzation
    await Organization.deleteOne({ _id: args.id });

    return org;
  } catch (e) {
    throw e;
  }
};

module.exports = removeOrganizaiton;
