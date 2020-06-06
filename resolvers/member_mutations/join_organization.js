const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const creatorCheck = require("../functions/creatorCheck");
const adminCheck = require("../functions/adminCheck");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //ensure organization exists
    let org = await Organization.findOne({ _id: args.data.organizationId });
    if (!org) throw new Error("Organization not found");

    //ensure user exists
    const user = await User.findOne({ _id: args.data.UserId });
    if (!user) throw new Error("User does not exist");

    //ensure person adding user is an admin
    adminCheck(context, org);

    //add user to organization's member field
    org.overwrite({
        ...org._doc,
        members: [...org._doc.members, user]
    })
    await org.save()

    //add organization to user's joined organization field
    user.overwrite({
        ...user._doc,
        joinedOrganizations: [...user._doc.joinedOrganizations, org]
    })
    await user.save()

    //return user
    return {
        ...user._doc,
        password:null
    }
  } catch (e) {
    throw e;
  }
};
