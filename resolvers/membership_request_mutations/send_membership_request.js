const User = require("../../models/User");
const Organization = require("../../models/Organization");
const MembershipRequest = require("../../models/MembershipRequest");
const authCheck = require("../functions/authCheck");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //ensure user exists
    const user = await User.findOne({ _id: context.userId });
    if (!user) throw new Error("User does not exist");

    //ensure organization exists
    let org = await Organization.findOne({ _id: args.organizationId });
    if (!org) throw new Error("Organization not found");

    //create membership request
    let newMembershipRequest = new MembershipRequest({
        user,
        organization: org,
    })
    newMembershipRequest = await newMembershipRequest.save();

    //add membership request to organization
    org.overwrite({
        ...org._doc,
        membershipRequests: [...org._doc.membershipRequests, newMembershipRequest]
    })
    await org.save();

    //add membership request to user
    user.overwrite({
        ...user._doc,
        membershipRequests: [...user._doc.membershipRequests, newMembershipRequest]
    })
    await user.save();

    return newMembershipRequest._doc; 
    
  } catch (e) {
    throw e;
  }
};
