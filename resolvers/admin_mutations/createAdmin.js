const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const creatorCheck = require("../functions/creatorCheck");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //checks to see if organization exists
    let org = await Organization.findOne({ _id: args.data.organizationId });
    if (!org) throw Apperror("Organization not found");

    //check if the user adding the admin is the creator of the organization
    creatorCheck(context, org);

    //ensures user to be made admin exists
    const user = await User.findOne({ _id: args.data.userId });
    if (!user) throw Apperror("User does not exist");

    //ensures user is a member of the organization
    const member = org._doc.members.filter((member) => member == user.id);
    if (member.length==0)
      throw Apperror("Only members can be made admins of an organization");

    //ADDS ADMIN TO ORGANIZATION
    org.overwrite({
        ...org._doc,
        admins: [...org._doc.admins, user]
    })
    await org.save()

    //Adds organization to the user's admin for field
    user.overwrite({
        ...user._doc,
        adminFor: [...user._doc.adminFor, org]
    })
    await user.save()

    return {
        ...user._doc,
        password:null
    }
  } catch (e) {
    throw Apperror("Server error" + e, 500);
  }
};
