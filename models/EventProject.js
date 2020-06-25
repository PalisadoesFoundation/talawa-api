const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const eventProjectSchema = new Schema({
	title: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	createdAt: { type: Date, default: Date.now },
	event: {
		type: Schema.Types.ObjectId,
		ref: "Event",
		required: true,
	},
	creator: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
});

module.exports = mongoose.model("EventProject", eventProjectSchema);
