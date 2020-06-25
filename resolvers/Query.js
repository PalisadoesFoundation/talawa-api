const User = require("../models/User");
const Organization = require("../models/Organization");
const Event = require("../models/Event");
const Post = require("../models/Post");
const GroupChat = require("../models/Message");


const EventProject = require("../models/EventProject");
const { login } = require("./Auth");
const authCheck = require("./functions/authCheck");


const Query = {
	users: async (parent, args, context, info) => {
		try {
			if (args.id) {
				const users = await User.find({ _id: args.id })
					.populate("createdOrganizations")
					.populate("createdEvents")
					.populate("joinedOrganizations")
					.populate("registeredEvents")
					.populate("eventAdmin")
					.populate("adminFor");
				if (!users[0]) throw new Error("User not found");
				else
					return users.map((user) => {
						return {
							...user._doc,
							password: null,
						};
					});
			} else {
				const users = await User.find()
					.populate("createdOrganizations")
					.populate("createdEvents")
					.populate("joinedOrganizations")
					.populate("registeredEvents")
					.populate("eventAdmin")
					.populate("adminFor");
				return users.map((user) => {
					return { ...user._doc, password: null };
				});
			}
		} catch (e) {
			throw e;
		}
	},
	me: async (parent, args, context, info) => {
		authCheck(context);
		try {
			//Ensure user exists
			const user = await User.findOne({ _id: context.userId });
			if (!user) throw new Error("User does not exist");
			//console.log(user._doc)

      return {
        ...user._doc,
        password:null
      }
    } catch (e) {
      throw e;
    }
  },
  login,
  organizations: async (parent, args, context, info) => {
    try {
      if (args.id) {
        const organizationFound = await Organization.find({ _id: args.id });
        if (!organizationFound[0]) {
          throw new Error("Organization not found");
        }
        return organizationFound;
      } else {
        return await Organization.find();
      }
    } catch (e) {
      throw e;
    }
  },
	login,
	organizations: async (parent, args, context, info) => {
		try {
			if (args.id) {
				const organizationFound = await Organization.find({
					_id: args.id,
				});
				if (!organizationFound[0]) {
					throw new Error("Organization not found");
				}
				return organizationFound;
			} else {
				return await Organization.find();
			}
		} catch (e) {
			throw e;
		}
	},
	event: async (parent, args, context, info) => {
		try {
			const eventFound = await Event.find({ _id: args.id })
				.populate("registrants")
				.populate("creator")
				.populate("admins");
			if (!eventFound) {
				throw new Error("Event not found");
			}
			return { ...eventFound._doc };
		} catch (e) {
			throw e;
		}
	},
	events: async (parent, args, context, info) => {
		try {
			if (args.id) {
				const eventFound = await Event.find({ _id: args.id })
					.populate("registrants")
					.populate("creator")
					.populate("admins");
				if (!eventFound[0]) {
					throw new Error("Event not found");
				}
				return eventFound;
			} else {
				return await Event.find()
					.populate("registrants")
					.populate("creator")
					.populate("admins");
			}
		} catch (e) {
			throw e;
		}
	},
	project: async (parent, args, context, info) => {
		try {
			const eventProjectFound = await EventProject.findOne({
				_id: args.id,
			})
				.populate("event")
				.populate("creator");
			if (!eventProjectFound) {
				throw new Error("Event not found");
			}
			return { ...eventProjectFound._doc };
		} catch (e) {
			throw e;
		}
	},
	projects: async (parent, args, context, info) => {
		try {
			if (args.id) {
				const eventProjectFound = await EventProject.find({
					_id: args.id,
				})
					.populate("event")
					.populate("creator");
				if (!eventProjectFound[0]) {
					throw new Error("Event not found");
				}
				return eventProjectFound;
			} else {
				return await EventProject.find()
					.populate("event")
					.populate("creator");
			}
		} catch (e) {
			throw e;
		}
	},
	projectsByEvent: async (parent, args, context, info) => {
		try {
			return await EventProject.find({ event: args.id })
				.populate("event")
				.populate("creator");
		} catch (e) {
			throw e;
		}
	},
	posts: async (parent, args, context, info) => {
		try {
			return await Post.find();
		} catch (e) {
			throw e;
		}
	},
	groupChats: async(parent,args,context,info)=> {
		try {
			return await GroupChat.find();
		} catch (e) {
			throw e;
		}
	}
};

module.exports = Query;
