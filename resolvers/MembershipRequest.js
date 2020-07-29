const User = require("../models/User");
const Organization = require("../models/Organization");

module.exports = {
    organization: async(parent,args,context,info)=> await Organization.findOne({_id: parent.organization}),
    user: async(parent,args,context,info)=>await User.findOne({_id: parent.user})
    
}