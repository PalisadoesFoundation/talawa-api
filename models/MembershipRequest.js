const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const membershipRequestSchema = new Schema({
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("MembershipRequest", membershipRequestSchema);
