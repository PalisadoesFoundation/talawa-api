const User = require("../../models/User");
const Organization = require("../../models/Organization");
const MembershipRequest = require("../../models/MembershipRequest");
const authCheck = require("../functions/authCheck");
const adminCheck = require("../functions/adminCheck");
const organizationExists = require("../../helper_functions/organizationExists");
const userExists = require("../../helper_functions/userExists")


module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //ensure membership request exists
    const membershipRequest = await MembershipRequest.findOne({
      _id: args.membershipRequestId,
    });
    if (!membershipRequest) throw new Error("Membership request not found");

    //ensure org exists
    let org = await organizationExists(membershipRequest.organization);


    //ensure user exists
    let user = await userExists(membershipRequest.user);


    //ensure user is admin
    adminCheck(context, org);
    
    //check to see if user is already a member
    org._doc.members.forEach(member=>{
        if(member._id == user.id){
            throw new Error("User is already a member")
        }
    })

    //add user in membership request as a member to the organization
    org.overwrite({
      ...org._doc,
      members: [...org._doc.members, user],
    });

    //delete membership request
    await MembershipRequest.deleteOne({_id: args.membershipRequestId});

    //remove membership request from organization
    org.overwrite({
        ...org._doc,
        membershipRequests: org._doc.membershipRequests.filter(request => request._id !== membershipRequest.id)
    })

    await org.save();

    //remove membership request from user
    user.overwrite({
        ...user._doc,
        joinedOrganizations: [...user._doc.joinedOrganizations, org],
        membershipRequests: user._doc.membershipRequests.filter(request => request._id !== membershipRequest.id)
    })

    await user.save();

    //return membershipship request
    return membershipRequest._doc
  } catch (e) {
    throw e;
  }
};
