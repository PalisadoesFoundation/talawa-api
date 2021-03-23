const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");


module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //ensure organization exists
    let org = await Organization.findOne({ _id: args.organizationId });
    if (!org) throw Apperror("Organization not found");

    //ensure user exists
    const user = await User.findOne({ _id: context.userId });
    if (!user) throw Apperror("User does not exist");

    //checks to see if the user trying to leave is the owner of the organization
    if(user.id == org._doc.creator) throw Apperror("Creator of organization cannot leave")

    //check to see if user is already a member
    const members = org._doc.members.filter((member) => member == user.id);
    if (members.length == 0) throw Apperror("User is not a member");


    //if the user is an admin he is removed from the organization's admin field
    org.overwrite({
      ...org._doc,
      admins: org._doc.admins.filter(admin=>admin!=user.id)
    })
    await org.save()

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
    throw Apperror("Server error" + e, 500);
  }
};
