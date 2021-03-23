const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const creatorCheck = require("../functions/creatorCheck");

module.exports = async (parent, args, context, info) => {
  //authCheck
  authCheck(context);

  try {
    //ensure organization exists
    let org = await Organization.findOne({ _id: args.data.organizationId });
    if (!org) throw Apperror("Organization not found");

    //ensure user exists
    const user = await User.findOne({ _id: args.data.userId });
    if (!user) throw Apperror("User does not exist");

    //ensure user is an admin
    const admin = org._doc.admins.filter((admin) => admin == user.id);
    if (admin.length==0)
      throw Apperror("User is not an admin");

    //ensure user trying to remove admin is the creator
    creatorCheck(context, org);

    //remove admin from organization
    org.overwrite({
        ...org._doc,
        admins: org._doc.admins.filter(admin=> admin != user.id)
    })
    await org.save()

    //remove organization from the user's adminFor field
    user.overwrite({
        ...user._doc,
        adminFor: user._doc.adminFor.filter(organization=> organization != org.id)
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
