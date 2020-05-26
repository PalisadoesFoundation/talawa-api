const User = require("../models/User");
const Organization = require("../models/Organization")
const { login } = require("./Auth");

const Query = {
  users: async (parent, args, context, info) => {
    try {
      const users = await User.find();
      return users.map((user) => {
        return { ...user._doc, password: null };
      });
    } catch (e) {
      throw e;
    }
  },
  login,
  organizations: async (parent, args,context, info)=> {
    try {
      return args.id ? await Organization.find({_id: args.id}): await Organization.find()

    }catch(e) {
      throw e;
    }
  }
};

module.exports = Query;
