const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const eventSchema = new Schema({
	title: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	attendees: {
		type: String,
		required: false,
	},
	location: {
		type: String,
	},
	recurring: {
		type: Boolean,
		required: true,
		default: false,
	},
	date: { type: Date, required: true },
	recurrance: {
		type: String,
		enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
		required: function () {
			return this.recurring;
		},
	},
	description: {
		type: String,
		required: true,
	},
	isPublic: {
		type: Boolean,
		required: true,
	},
	isRegisterable: {
		type: Boolean,
		required: true,
	},
	creator: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	registrants: [
		{
			type: Schema.Types.ObjectId,
			ref: "User",
		},
	],
	admins: [
		{
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	],
	organization: {
		type: Schema.Types.ObjectId,
		ref: "Organization",
		required: true,
	},
});

module.exports = mongoose.model("Event", eventSchema);
