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

    //ensure user isnt already blocked
    const blocked = org._doc.blockedUsers.filter(
      (blockedUser) => blockedUser == user.id
    );
    if (blocked[0]) throw new Error("User is already blocked");

    //add user to organizations blocked users field
    org.overwrite({
      ...org._doc,
      blockedUsers: [...org._doc.blockedUsers, user],
    });
    await org.save();

    //add organization to users organizationsblockedbyfield
    user.overwrite({
      ...user._doc,
      organizationsBlockedBy: [...user._doc.organizationsBlockedBy, org],
    });
    await user.save();

    return {
      ...user._doc,
      password: null,
    };
  } catch (e) {
    throw e;
  }
};
