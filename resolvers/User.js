const Organization = require("../models/Organization");

const User = {
  createdOrganizations: async (parent, args, context, info) => {
    return await Organization.find({creator: parent._id});
  },
  adminFor: async(parent,args,context,info)=> {
    let organizations = await Organization.find();
    organizations = organizations.filter((org)=> {
      if(parent.adminFor.includes(org._id)) return org
    })
    return organizations
  },
  joinedOrganizations: async (parent, args,context,info)=> {
    let organizations = await Organization.find();
    organizations = organizations.filter((org)=> {
      if(parent.joinedOrganizations.includes(org._id)) return org
    })
    return organizations
  }
};

module.exports = User;
