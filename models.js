const mongoose = require('mongoose');
const {Schema} = mongoose;

const createdOn = Date.now();

const replySchema = new Schema({
  text: String,
  created_on: {type: Date, default: createdOn},
  delete_password: {type: String, required: true},
  reported: {type: Boolean, default: false},
});

const threadSchema = new Schema({
  text: String,
  created_on: {type: Date, default: createdOn},
  bumped_on: {type: Date, default: createdOn},
  reported: {type: Boolean, default: false},
  delete_password: {type: String, required: true},
  replies: [replySchema]
});

const boardSchema = new Schema({
  name: {type: String, required: true},
  threads: {type: [threadSchema], default: []}
});

const Board = mongoose.model('Board', boardSchema);
const Thread = mongoose.model('Thread', threadSchema);
const Reply = mongoose.model('Reply', replySchema);

exports.Board = Board;
exports.Thread = Thread;
exports.Reply = Reply;