// I have utilized Perplexity and ChatGPT as resources for guidance and learning throughout this project. My approach reflects the growing trend of modern developers using AI tools to enhance their coding processes. However, all the final code presented here is my own work, based on own independently thought out prompts and without copying prompts or code from others other than snippets. I believe this practice aligns with the principles of academic honesty, as it emphasizes learning and using technology responsibly.

'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReplySchema = new Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  reported: { type: Boolean, default: false },
  created_on: { type: Date, default: Date.now }
});

const ThreadSchema = new Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  reported: { type: Boolean, default: false },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  replies: [{ type: Schema.Types.ObjectId, ref: 'Reply' }]
});

// Prevent overwriting models
const Thread = mongoose.models.Thread || mongoose.model('Thread', ThreadSchema);
const Reply = mongoose.models.Reply || mongoose.model('Reply', ReplySchema);

module.exports = { Thread, Reply };
