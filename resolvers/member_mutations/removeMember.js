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

    //ensure user is an admin
    adminCheck(context, org);

    //ensure user exists
    const user = await User.findOne({ _id: args.data.userId });
    if (!user) throw new Error("User does not exist");

    //ensure member being removed by admin is already a member
    const members = org._doc.members.filter((member) => member == user.id);
    if (members.length == 0) throw new Error("User is not a member");

    //ensure the user the admin is trying to remove isn't an admin
    if(org._doc.admins.includes(user.id)) throw new Error("Administrators cannot remove members who are also Administrators")

    //ensure the user the admin is trying to remove isn't the creator
    if(org._doc.creator == user.id) throw new Error("Administratos cannot remove the creator of the organization from the organization")

    //remove member from organization
    org.overwrite({
      ...org._doc,
      members: org._doc.members.filter((member) => member != user.id),
    });
    await org.save();

    //return user
    return {
      ...user._doc,
      password: null,
    };
  } catch (e) {
    throw e;
  }
};
