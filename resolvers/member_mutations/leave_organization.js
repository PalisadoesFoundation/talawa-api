const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const creatorCheck = require("../functions/creatorCheck");
const adminCheck = require("../functions/adminCheck");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //ensure organization exists
    let org = await Organization.findOne({ _id: args.organizationId });
    if (!org) throw new Error("Organization not found");

    //ensure user exists
    const user = await User.findOne({ _id: context.userId });
    if (!user) throw new Error("User does not exist");

    //check to see if user is already a member
    const members = org._doc.members.filter((member) => member == user.id);
    if (members.length == 0) throw new Error("User is not a member");

    //remove user from the organization's members field
    org.overwrite({
      ...org._doc,
      members: org._doc.members.filter((member) => member != user.id),
    });
    await org.save();

    //remove organization from user's joined organization field
    user.overwrite({
      ...user._doc,
      joinedOrganizations: user._doc.joinedOrganizations.filter(
        (organization) => organization != org.id
      ),
    });
    await user.save();

    //return user
    return {
      ...user._doc,
      password: null,
    };
  } catch (e) {
    throw e;
  }
};
