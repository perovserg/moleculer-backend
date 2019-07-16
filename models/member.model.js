"use strict";

const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema({
	name: {
		type: String,
		required: "Please fill in a name",
		trim: true
	},
	email: {
		type: String,
		trim: true,
		unique: true,
		index: true,
		lowercase: true,
		required: "Please fill in an email"
	},
	result: {
		type: Number
	},
	avatar: {
		type: String
	}
}, {
	timestamps: true
});

module.exports = mongoose.model("Member", MemberSchema);
