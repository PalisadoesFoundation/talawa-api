const User = require("../models/User");
const Organization = require("../models/Organization");
const Event = require("../models/Event");
const Post = require("../models/Post");
const Group = require("../models/Group");
const Comment = require("../models/Comment");

const Task = require("../models/Task");

const authCheck = require("./functions/authCheck");
const DirectChat = require("../models/DirectChat");
const DirectChatMessages = require("../models/DirectChatMessage");

const GroupChat = require("../models/GroupChat");
const GroupChatMessages = require("../models/GroupChatMessage");


const Query = {
	groupChats: async (parent, args, context, info) => {
		return await GroupChat.find();
	},
	groupChatMessages: async (parent, args, context, info) => {
		return await GroupChatMessages.find();
	},
	directChats: async (parent, args, context, info) => {
		return await DirectChat.find();
	},
	directChatMessages: async (parent, args, context, info) => {
		return await DirectChatMessages.find();
	},
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
				password: null,
			};
		} catch (e) {
			throw e;
		}
	},
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
			const eventFound = await Event.findOne({ _id: args.id })
				// .populate("registrants")
				.populate("creator", "-password")
				.populate("tasks")
				.populate("admins", "-password");
			if (!eventFound) {
				throw new Error("Event not found");
			}
			eventFound.isRegistered = false;
			if (eventFound.registrants.includes(context.userId)) {
				eventFound.isRegistered = true;
			}
			console.log(eventFound.isRegistered);
			return eventFound;
		} catch (e) {
			throw e;
		}
	},
	registrantsByEvent: async (parent, args, context, info) => {
		try {
			const eventFound = await Event.findOne({ _id: args.id })
				.populate("registrants", "-password");
			if (!eventFound) {
				throw new Error("Event not found");
			}
			//return eventFound.registrants || [];
			return eventFound.registrants ? eventFound.registrants.map((registrant) => {
				return {
					...registrant._doc,
					password: null,
				};
			}) : [];
		} catch (e) {
			throw e;
		}
	},
	events: async (parent, args, context, info) => {
		try {
			const e = await Event.find()
				// .populate("registrants")
				.populate("creator", "-password")
				.populate("tasks")
				.populate("admins", "-password");
			const events = e.map((event) => {
				event.isRegistered = false;
				if (event.registrants.includes(context.userId)) {
					event.isRegistered = true;
				}
				return event;
			});
			return events;
		} catch (e) {
			throw e;
		}
	},
	eventsByOrganization: async (parent, args, context, info) => {
		try {
			const e = await Event.find({ organization: args.id })
				// .populate("registrants")
				.populate("creator", "-password")
				.populate("tasks")
				.populate("admins", "-password");
			const events = e.map((event) => {
				event.isRegistered = false;
				if (event.registrants.includes(context.userId)) {
					event.isRegistered = true;
				}
				return event;
			});
			return events;
		} catch (e) {
			throw e;
		}
	},
	registeredEventsByUser: async (parent, args, context, info) => {
		try {
			return await Event.find({ registrants: args.id })
				.populate("registrants")
				.populate("creator", "-password")
				.populate("tasks")
				.populate("admins", "-password");
		} catch (e) {
			throw e;
		}
	},
	tasksByEvent: async (parent, args, context, info) => {
		try {
			return await Task.find({ event: args.id })
				.populate("event")
				.populate("creator", "-password");
		} catch (e) {
			throw e;
		}
	},
	tasksByUser: async (parent, args, context, info) => {
		try {
			return await Task.find({ creator: args.id })
				.populate("event")
				.populate("creator", "-password");
		} catch (e) {
			throw e;
		}
	},
	comments: async (parent, args, context, info) => {
		try {
			const commentFound = await Comment.find()
				.populate("creator", "-password")
				.populate("post")
				.populate("likedBy");
			if(!commentFound){
				throw new Error("Comment not Found")
			}
			return commentFound;	
		} catch (e) {
			throw e;
		}
	},
	commentsByPost: async (parent, args, context, info) => {
		try {
			const commentFound = await Comment.find({ post: args.id })
				.populate("creator", "-password")
				.populate("post")
				.populate("likedBy");
			if(!commentFound){
				throw new Error("Comment not Found")
			}
			return commentFound;	
		} catch (e) {
			throw e;
		}
	},
	post: async (parent, args, context, info) => {
		try {
			const postFound = await Post.findOne({
				_id: args.id,
			})
				.populate("organization")
				.populate({
					path: "comments",
					populate: {
						path: "creator",
					},
				})
				.populate("likedBy")
				.populate("creator", "-password");
			if (!postFound) {
				throw new Error("Post not found");
			}
			postFound.likeCount = postFound.likedBy.length || 0;
			postFound.commentCount = postFound.comments.length || 0;
			return postFound;
		} catch (e) {
			throw e;
		}
	},
	posts: async (parent, args, context, info) => {
		try {
			const p = await Post.find()
				.populate("organization")
				.populate("likedBy")
				.populate({
					path: "comments",
					populate: {
						path: "creator",
					},
				})
				.populate("creator", "-password");
			const posts = p.map((post) => {
				post.likeCount = post.likedBy.length || 0;
				post.commentCount = post.comments.length || 0;
				return post;
			});
			return posts;
		} catch (error) {
			throw e;
		}
	},
	postsByOrganization: async (parent, args, context, info) => {
		try {
			const p = await Post.find({ organization: args.id })
				.populate("organization")
				.populate("likedBy")
				.populate({
					path: "comments",
					populate: {
						path: "creator",
					},
				})
				.populate("creator", "-password");
			const posts = p.map((post) => {
				post.likeCount = post.likedBy.length || 0;
				post.commentCount = post.comments.length || 0;
				return post;
			});
			return posts;
		} catch (e) {
			throw e;
		}
	},
	groups: async (parent, args, context, info) => {
		try {
			return await Group.find();
		} catch (e) {
			throw e;
		}
	},
};

module.exports = Query;
