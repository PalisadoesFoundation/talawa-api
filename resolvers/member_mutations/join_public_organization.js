const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //ensure organization exists
    let org = await Organization.findOne({ _id: args.organizationId });
    if (!org) throw Apperror("Organization not found");

    //ensures organization is public
    if(!org._doc.isPublic) throw Apperror("Organization is not public")

    //ensure user exists
    const user = await User.findOne({ _id: context.userId });
    if (!user) throw Apperror("User does not exist");

    //check to see if user is already a member
    const members = org._doc.members.filter(member=> member == user.id)
    if(members.length!=0) throw Apperror("User is already a member")

    //add user to organization's members field
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
    throw Apperror("Server error" + e, 500);
  }
};
