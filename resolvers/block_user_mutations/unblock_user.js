const authCheck = require("../functions/authCheck");
const adminCheck = require("../functions/adminCheck");
const organizationExists = require("../../helper_functions/organizationExists");
const userExists = require("../../helper_functions/userExists");

module.exports = async (parent, args, context, info) => {
  try {
    authCheck(context);

    //ensure org exists
    let org = await organizationExists(args.organizationId);

    //ensure user exists
    let user = await userExists(args.userId);

    //ensure user is admin
    adminCheck(context, org);

    //ensure user is blocked
    const blocked = org._doc.blockedUsers.filter(
      blockedUser => blockedUser == user.id
    );
    if(!blocked[0]) throw Apperror("Cannot unblock a user that isnt currently blocked")

    // remove user from organizations blocked users field
    org.overwrite({
      ...org._doc,
      blockedUsers: org._doc.blockedUsers.filter(blockedUser => blockedUser != user.id)
    });
    await org.save();

    //add organization to users organizationsblockedbyfield
    user.overwrite({
      ...user._doc,
      organizationsBlockedBy: user._doc.organizationsBlockedBy.filter((organization) => organization != org.id)
    });
    await user.save();

    return {
      ...user._doc,
      password: null,
    };
  } catch (e) {
    throw Apperror("Server error" + e, 500);
  }
};
