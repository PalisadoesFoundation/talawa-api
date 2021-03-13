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
	usersConnection: async (parent, args, context, info) => {
		try {
			var inputArg = {};
			var isSortingExecuted = args.orderBy != null;
			const filterParam = args.where

			if (filterParam){
				//Returns provided id user
				if(filterParam.id){
					inputArg = {
						...inputArg,
						_id: filterParam.id
					}
				}

				//Returns all user other than provided id
				if(filterParam.id_not){
					inputArg = {
						...inputArg,
						_id: { "$ne" : filterParam.id_not}
					}
				}

				//Return users with id in the provided list
				if(filterParam.id_in){
					inputArg = {
						...inputArg,
						_id: {"$in": filterParam.id_in}
					}
				}

				//Returns user not included in provided id list
				if(filterParam.id_not_in){
					inputArg = {
						...inputArg,
						_id: {"$nin": filterParam.id_not_in}
					}
				}

				//Returns users with id having provided string
				if(filterParam.id_contains){
					inputArg = {
						...inputArg,
						_id: {"$regex": filterParam.id_contains, "$options": "i"}
					}
				}

				//Returns users with id starts with provided string
				if(filterParam.id_starts_with){
					var regexp = new RegExp("^"+ filterParam.id_starts_with);
					inputArg = {
						...inputArg,
						_id: regexp
					}
				}

				//Returns provided firstName user
				if(filterParam.firstName){
					inputArg = {
						...inputArg,
						firstName: filterParam.firstName
					}
				}

				//Returns user with not that firstName
				if(filterParam.firstName_not){
					inputArg = {
						...inputArg,
						firstName: { "$ne" : filterParam.firstName_not}
					}
				}

				//Return users with the given list firstName
				if(filterParam.firstName_in){
					inputArg = {
						...inputArg,
						firstName: {"$in": filterParam.firstName_in}
					}
				}

				//Returns users with firstName not in the provided list
				if(filterParam.firstName_not_in){
					inputArg = {
						...inputArg,
						firstName: {"$nin": filterParam.firstName_not_in}
					}
				}

				//Returns users with first name containing provided string
				if(filterParam.firstName_contains){
					inputArg = {
						...inputArg,
						firstName: {"$regex": filterParam.firstName_contains, "$options": "i"}
					}
				}

				//Returns users with firstName starts with that provided string
				if(filterParam.firstName_starts_with){
					var regexp = new RegExp("^"+ filterParam.firstName_starts_with);
					inputArg = {
						...inputArg,
						firstName: regexp
					}
				}

				//Returns lastName user
				if(filterParam.lastName){
					inputArg = {
						...inputArg,
						lastName: filterParam.lastName
					}
				}

				//Returns user with not that lastName
				if(filterParam.lastName_not){
					inputArg = {
						...inputArg,
						lastName: { "$ne" : filterParam.lastName_not}
					}
				}

				//Return users with lastName in provided list
				if(filterParam.lastName_in){
					inputArg = {
						...inputArg,
						lastName: {"$in": filterParam.lastName_in}
					}
				}

				//Return users with lastName not in provided list
				if(filterParam.lastName_not_in){
					inputArg = {
						...inputArg,
						lastName: {"$nin": filterParam.lastName_not_in}
					}
				}

				//Return users with lastName should containing provided string
				if(filterParam.lastName_contains){
					inputArg = {
						...inputArg,
						lastName: {"$regex": filterParam.lastName_contains, "$options": "i"}
					}
				}

				//Returns users with LastName starting with provided string
				if(filterParam.lastName_starts_with){
					var regexp = new RegExp("^"+ filterParam.lastName_starts_with);
					inputArg = {
						...inputArg,
						lastName: regexp
					}
				}

				//Returns provided email user
				if(filterParam.email){
					inputArg = {
						...inputArg,
						email: filterParam.email
					}
				}

				//Returns user with not that provided email
				if(filterParam.email_not){
					inputArg = {
						...inputArg,
						email: { "$ne" : filterParam.email_not}
					}
				}

				//User email falls in provided list
				if(filterParam.email_in){
					inputArg = {
						...inputArg,
						email: {"$in": filterParam.email_in}
					}
				}

				//Return User email not falls in the list
				if(filterParam.email_not_in){
					inputArg = {
						...inputArg,
						email: {"$nin": filterParam.email_not_in}
					}
				}

				//Return users with email containing provided string
				if(filterParam.email_contains){
					inputArg = {
						...inputArg,
						email: {"$regex": filterParam.email_contains, "$options": "i"}
					}
				}

				//Returns user with email starts with provided string
				if(filterParam.email_starts_with){
					var regexp = new RegExp("^"+ filterParam.email_starts_with);
					inputArg = {
						...inputArg,
						email: regexp
					}
				}
			}
			
			var sort = {}
			if(isSortingExecuted){
				if(args.orderBy == "id_ASC"){
					sort = { _id: 1 }
				}

				else if(args.orderBy == "id_DESC"){
					sort = { _id: -1 }
				}

				else if(args.orderBy == "firstName_ASC"){
					sort = { firstName: 1 }
				}

				else if(args.orderBy == "firstName_DESC"){
					sort = { firstName: -1 }
				}

				else if(args.orderBy == "lastName_ASC"){
					sort = { lastName: 1 }
				}

				else if(args.orderBy == "lastName_DESC"){
					sort = { lastName: -1 }
				}

				else if(args.orderBy == "email_ASC"){
					sort = { email: 1 }
				}

				else {
					sort = {email: -1}
				}
			}

			const users = await User.find(inputArg)
				.sort(sort)
				.limit(args.first)
				.skip(args.skip)
				.populate("createdOrganizations")
				.populate("createdEvents")
				.populate("joinedOrganizations")
				.populate("registeredEvents")
				.populate("eventAdmin")
				.populate("adminFor");

			return users.map((user) => {
				return { ...user._doc, password: null };
			});
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
			return await Comment.find()
				.populate("creator", "-password")
				.populate("post");
		} catch (e) {
			throw e;
		}
	},
	commentsByPost: async (parent, args, context, info) => {
		try {
			return await Comment.find({ post: args.id })
				.populate("creator", "-password")
				.populate("post");
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
