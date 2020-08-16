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

    //check to see if request already exists
    
    let reqExists = org._doc.membershipRequests.filter(async req => {
      let request = await MembershipRequest.findOne({_id: req});
      let requestUser = await User.findOne({_id: request.user})
      if(requestUser._id.toString() == user._id) return req
    })
    if(reqExists.length>0)throw new Error("This user has already sent a membership request to this organization") 

    //let exists = org._doc.membershipRequests.filter(req => req.user._id == user.id)
    //if(exists.length>0) throw new Error("This user has already sent a membership request to this organization")

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
